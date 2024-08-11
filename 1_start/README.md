#### 1. 네트워크 환경 설정

- https://chainlist.org/chain/97
- [Bnb Faucet](https://www.bnbchain.org/en/testnet-faucet)

##### (1) 환경 변수

```title=.env
RPC_Endpoints=
OWNER_PUBLIC_KEY=
OWNER_PRIVATE_KEY=
RECEIVER_PUBLIC_KEY=
MY_ERC721_VOTE_CA=
MY_GOVERNOR_CA=
```

##### (2) 네트워크 설정에 bnb 네크워크 추가

```ts title=hardhat.config.ts
require("dotenv").config();
const { RPC_Endpoints, OWNER_PRIVATE_KEY } = process.env;

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  networks: {
    ganache: {
      url: RPC_Endpoints,
      accounts: [OWNER_PRIVATE_KEY!],
    },
    sepolia: {
      url: RPC_Endpoints,
      accounts: [OWNER_PRIVATE_KEY!],
    },
    bnb: {
      url: RPC_Endpoints,
      accounts: [OWNER_PRIVATE_KEY!],
    },
  },
  solidity: "0.8.24",
};

export default config;
```

#### 2. 테스트넷에 배포

##### (1) 배포 스크립트 수정하기

- deploy.ts

```ts title=deploy/deploy.ts
import { ethers } from "hardhat";

async function main() {
  console.log("Start MyERC721Vote contract deployment");

  // Deploy MyERC721Vote contract
  const erc721Factory = await ethers.getContractFactory("MyERC721Vote");
  const erc721Contract = await erc721Factory.deploy();

  // 배포 트랜잭션이 완료될 때까지 대기
  await erc721Contract.deploymentTransaction()?.wait();

  const erc721Address = await erc721Contract.getAddress();
  console.log(`MyERC721Vote Contract is deployed: ${erc721Address}`);

  console.log("Start MyGovernor contract deployment");

  // Deploy MyGovernor contract with the address of the deployed MyERC721Vote contract
  const governorFactory = await ethers.getContractFactory("MyGovernor");
  const governorContract = await governorFactory.deploy(erc721Address);

  // 배포 트랜잭션이 완료될 때까지 대기
  await governorContract.deploymentTransaction()?.wait();

  const governorAddress = await governorContract.getAddress();
  console.log(`MyGovernor Contract is deployed: ${governorAddress}`);

  // Grant MINTER_ROLE to the MyGovernor contract
  const MINTER_ROLE = await erc721Contract.MINTER_ROLE();

  const tx = await erc721Contract.grantRole(MINTER_ROLE, governorAddress);

  // Role 부여 트랜잭션이 완료될 때까지 대기
  await tx.wait();

  console.log(`Granted MINTER_ROLE to MyGovernor contract`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

##### (3) 배포

```shell
npx hardhat run deploy/deploy.ts --network bnb
```

![image](https://github.com/user-attachments/assets/be8e64da-6226-485f-b5e0-283e885f3c08)

##### (3) 배포된 bnb scan에서 확인

- https://testnet.bscscan.com/address/0xc669BeE3ab8b4d256d2F3C942d07BAc727914146
- https://testnet.bscscan.com/address/0x2Da38C4Ba7758310855Cc13F83327D4B4AC44286

##### (4) 스크립트 수정하기

- vote_deploy.ts

```ts title=scripts/vote_deploy.ts
require("dotenv").config();
import { ethers, network } from "hardhat";

const { MY_ERC721_VOTE_CA, MY_GOVERNOR_CA, RECEIVER_PUBLIC_KEY } = process.env;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBlocks(numBlocks: number, blockTimeInSeconds: number) {
  for (let i = 0; i < numBlocks; i++) {
    console.log(`Waiting for block ${i + 1}/${numBlocks}...`);
    await sleep(blockTimeInSeconds * 1000); // 테스트넷에서의 평균 블록 생성 시간
  }
}

async function sendWithRetry(
  txFunc: () => Promise<any>,
  retries: number = 3
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const tx = await txFunc();
      const receipt = await tx.wait();
      return receipt;
    } catch (error: any) {
      console.log(`Transaction failed with error: ${error.message}`);
      if (i === retries - 1) throw error;
      console.log(`Retrying... (${i + 1}/${retries})`);
    }
  }
}

async function main() {
  try {
    const [owner] = await ethers.getSigners();

    const MyERC721Vote = await ethers.getContractAt(
      "MyERC721Vote",
      MY_ERC721_VOTE_CA!
    );
    const MyGovernor = await ethers.getContractAt(
      "MyGovernor",
      MY_GOVERNOR_CA!
    );

    await sendWithRetry(() => MyERC721Vote.mint(owner.address));
    await sendWithRetry(() =>
      MyERC721Vote.connect(owner).delegate(owner.address)
    );
    console.log(`Votes delegated to ${owner.address}`);

    const targets = [MY_ERC721_VOTE_CA!];
    const values = [0];
    const calldatas = [
      MyERC721Vote.interface.encodeFunctionData("mint", [RECEIVER_PUBLIC_KEY!]),
    ];
    const description = "Mint a new NFT to addr22222222222";

    const proposeTx = await MyGovernor.propose(
      targets,
      values,
      calldatas,
      description
    );
    const proposeReceipt = await proposeTx.wait();
    const proposeId = await MyGovernor.hashProposal(
      targets,
      values,
      calldatas,
      ethers.id(description)
    );

    console.log(`Proposal created with ID: ${proposeId}`);

    const votingDelay = await MyGovernor.votingDelay();
    const blockTimeInSeconds = 3; // 테스트넷의 평균 블록 생성 시간
    await waitForBlocks(Number(votingDelay), blockTimeInSeconds);
    const voteState = await MyGovernor.state(proposeId);
    console.log("Proposal state:", voteState);

    let currentBlockNumber = await ethers.provider.getBlockNumber();
    console.log("Current Block Number:", currentBlockNumber);

    const voteTx = await MyGovernor.castVote(proposeId, 1); // 1은 찬성
    await voteTx.wait();

    console.log("Vote cast successfully");

    const votingPeriod = await MyGovernor.votingPeriod();
    await waitForBlocks(Number(votingPeriod), blockTimeInSeconds);

    currentBlockNumber = await ethers.provider.getBlockNumber();
    console.log("Current Block Number:", currentBlockNumber);

    const afterVoteState = await MyGovernor.state(proposeId);
    console.log("Proposal state after voting:", afterVoteState);

    if (afterVoteState === BigInt(4)) {
      const executeTx = await MyGovernor.execute(
        targets,
        values,
        calldatas,
        ethers.id(description)
      );
      await executeTx.wait();

      console.log("Proposal executed successfully");
      await waitForBlocks(Number(3), blockTimeInSeconds);
      const newOwner = await MyERC721Vote.ownerOf(1);
      console.log(`New NFT Owner is: ${newOwner}`);
    } else {
      console.log("Proposal did not succeed. Current state:", afterVoteState);
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}

main();
```

##### (5) 배포된 Contract와 상호작용

```shell
npx hardhat run scripts/vote_deploy.ts --network bnb
```
