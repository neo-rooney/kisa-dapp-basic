### 테스트넷에 배포하기

#### 1. 네트워크 환경 설정

- https://www.alchemy.com/chain-connect/chain/sepolia

##### (1) 환경 변수

```title=.env
RPC_Endpoints=
OWNER_PUBLIC_KEY=
OWNER_PRIVATE_KEY=
RECEIVER_PUBLIC_KEY=
CA=
```

##### 2) 네트워크 설정에 sepolia 네크워크 추가

```ts title=hardhat.config.ts
require("dotenv").config();
const { RPC_Endpoints, OWNER_PRIVATE_KEY } = process.env;

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545/",
      accounts: [OWNER_PRIVATE_KEY!],
    },
    sepolia: {
      url: RPC_Endpoints,
      accounts: [OWNER_PRIVATE_KEY!],
    },
  },
  solidity: "0.8.24",
};

export default config;
```

#### 2. 테스트넷에 배포

##### (1) 배포

```shell
npx hardhat run deploy/deploy.ts --network sepolia
```

![image](https://github.com/user-attachments/assets/77750cd1-00ca-43f3-81cf-0334fe2f6cea)

##### (2) 배포된 Contract etherscan에서 확인

- https://sepolia.etherscan.io/address/0x3C7584E108036e533C75F2Db3f7525e2c9A3eB79

##### (3) 배포된 Contract와 상호작용

```shell
npx hardhat run scripts/getBalances.ts --network sepolia
npx hardhat run scripts/purchase.ts --network sepolia
npx hardhat run scripts/purchaseEvent.ts --network sepolia
npx hardhat run scripts/refill.ts --network sepolia
```

### 프론트 기획 & 개발

#### 1. Front 코드 확인

```shell
cd front

npm install

npm run dev
```
