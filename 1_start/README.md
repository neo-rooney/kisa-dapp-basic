### 테스트넷에 배포하기

#### 0. 블록체인 실습 준비
```shell
cd 1_start/blockchain

npm install
```

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

#### 2. 메타마스크 연동

##### (1) App.tsx

- https://docs.metamask.io/wallet/tutorials/react-dapp-global-state/
- `WalletContextProvider` 로 `VendingMachine` 감싸기

```tsx title=App.tsx
import VendingMachine from "@/components/VendingMachine";
import { WalletContextProvider } from "@/contexts/WalletContext/WalletContext";

function App() {
  return (
    <main className="w-full h-dvh flex items-center justify-center">
      <WalletContextProvider>
        <VendingMachine />
      </WalletContextProvider>
    </main>
  );
}

export default App;
```

##### (2) 지갑 UI 추가

- useWalletContext 주석 풀기
- components/VendingMachine.tsx

```tsx title=components/VendingMachine.tsx
{
  Object.keys(wallets).length > 0 ? (
    Object.values(wallets).map((provider: EIP6963ProviderDetail) => (
      <div className="flex items-center gap-4" key={provider.info.uuid}>
        <Avatar className="hidden h-9 w-9 sm:flex">
          <AvatarImage src={provider.info.icon} alt="Avatar" />
          <AvatarFallback>IN</AvatarFallback>
        </Avatar>
        <div className="grid gap-1">
          <p className="text-sm font-medium leading-none">
            {provider.info.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedWallet?.info.name === provider.info.name && selectedAccount
              ? formatAddress(selectedAccount)
              : "연결되지 않음"}
          </p>
        </div>
        <div className="ml-auto font-medium">
          {selectedWallet?.info.name !== provider.info.name ? (
            <Button
              variant="outline"
              onClick={() => connectWallet(provider.info.rdns)}
            >
              연결
            </Button>
          ) : (
            <Button variant="outline" onClick={disconnectWallet}>
              연결 해제
            </Button>
          )}
        </div>
      </div>
    ))
  ) : (
    <div>there are no Announced Providers</div>
  );
}
```

#### 3. Contract에서 필요한 정보 가져오기

##### (1) ABI 가져오기

- src/abi 폴더 만들기
- src/abi/VendingMachine.ts

```ts title=src/abi/VendingMachine.ts
export const VM_JSON = {
  // 복사 붙여넣기
};
```

##### (2) Smart Contract Address

- components/VendingMachine.tsx

```tsx title=components/VendingMachine.tsx
const VM_CA=0x...
```

##### (3) Smart Contract와 연결해서 데이터 가져오기

```tsx title=components/VendingMachine.tsx
useEffect(() => {
  async function load() {
    try {
      if (!selectedWallet) return;

      const provider = new ethers.BrowserProvider(selectedWallet?.provider);
      const signer = await provider.getSigner();
      console.log("signer", signer);

      const abi = VM_JSON.abi;

      const VendingMachineContract = new ethers.Contract(VM_CA, abi, signer);
      console.log("VendingMachineContract>>", VendingMachineContract);
      setContract(VendingMachineContract);

      const balance = await VendingMachineContract.cupcakeBalances(VM_CA);
      console.log("balance>>", Number(balance));
      setBalance(Number(balance));

      const owner = await VendingMachineContract.owner();
      console.log("owner>>", owner);
      setIsOwner(
        ethers.getAddress(owner) === ethers.getAddress(selectedAccount!)
      );

      const myAmount = await VendingMachineContract.cupcakeBalances(
        selectedAccount
      );
      setMyCupCake(Number(myAmount));
    } catch (e) {
      console.error(e);
    }
  }
  load();
}, [selectedWallet]);
```

##### (4) Smart Contract로 부터 가져온 정보 화면에 보여주기

- 내 컵케이크 개수

```tsx
<CardDescription>
  {selectedAccount ? `🎂 ${myCupCake} 개` : "지갑을 연결해주세요."}
</CardDescription>
```

- 남은 컵케이크 개수

```tsx
<Input id="amount" value={balance} readOnly />
```

- 컨트렉트 Owner만 리필 버튼 보이도록

```tsx
{
  owner && (
    <Button className="w-full" variant="outline">
      100개 리필하기
    </Button>
  );
}
```

#### 4. 구매하기

##### (1) 구매하기 함수 정의

```ts
const handleClickBuy = async () => {
  try {
    const ethValueInWei = ethers.parseUnits(amount, "ether");

    if (!contract) return;

    // 트랜잭션에 필요한 가스 양을 미리 계산
    const gasLimit = await contract.purchase.estimateGas(amount, {
      value: ethValueInWei,
    });
    if (!selectedWallet) return;
    const provider = new ethers.BrowserProvider(selectedWallet?.provider);
    // 네트워크의 현재 가스 가격을 가져옴
    const feeData = await provider?.getFeeData();
    console.log(feeData);
    const tx = await contract.purchase(amount, {
      value: ethValueInWei,
      gasLimit, // 계산된 가스 리밋을 사용
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      maxFeePerGas: feeData.maxFeePerGas,
    });

    // 트랜잭션이 블록에 포함될 때까지 기다림
    await tx.wait();

    const newBalance = await contract.cupcakeBalances(VM_CA);
    setBalance(Number(newBalance));
    const myAmount = await contract.cupcakeBalances(selectedAccount);
    setMyCupCake(Number(myAmount));
    setAmount("");
  } catch (e) {}
};
```

##### (2) 구매하기 함수 UI에 연결

```tsx
<Button className="w-full" onClick={handleClickBuy}>
  구매하기
</Button>
```

#### 5. 리필하기

##### (1) 리필 함수 정의

```ts
const handleClickRefill = async () => {
  const amount = 100;

  const gasLimit = await contract?.refill.estimateGas(amount);
  if (!selectedWallet) return;
  const provider = new ethers.BrowserProvider(selectedWallet?.provider);
  // 네트워크의 현재 가스 가격을 가져옴
  const feeData = await provider?.getFeeData();
  console.log(feeData);

  const tx = await contract?.refill(amount, {
    gasLimit, // 계산된 가스 리밋을 사용
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    maxFeePerGas: feeData.maxFeePerGas,
  });

  // 트랜잭션이 블록에 포함될 때까지 기다림
  await tx.wait();

  const newBalance = await contract?.cupcakeBalances(VM_CA);
  setBalance(Number(newBalance));
};
```

##### (2) 리필 함수 UI에 연결

```
{owner && (
  <Button
    className="w-full"
    variant="outline"
    onClick={handleClickRefill}
  >
    100개 리필하기
  </Button>
)}
```
