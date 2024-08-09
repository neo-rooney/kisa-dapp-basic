#### 1. 프론트엔드 코드

```shell
npm install
npm run dev
```

#### 2. 메타마스크 연동

##### (1) 메타마스크에 Ganache 계정 가져오기

- ganache 실행
- ganache 네트워크 추가
  - 네트워크 직접 추가
  - 네트워크 이름 : ganache
  - 새 RPC URL : http://127.0.0.1:7545
  - 체인 ID : 1337
  - 통화 기호 : ETH
  - 블록 탐색기 URL : 비워도 괜찮음

##### (2) App.tsx

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

##### (3) 지갑 UI 추가

- components/VendingMachine.tsx
- console.log로 wallets 확인해보기

```tsx title=components/VendingMachine.tsx
const {
  wallets,
  selectedWallet,
  selectedAccount,
  connectWallet,
  disconnectWallet,
} = useWalletContext();

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
  )
}
```

#### 3. Contract와 상호작용하기

##### (1) ABI 가져오기

- src/abi 폴더 만들기
- src/abi/vendingMachine.ts

```ts title=src/abi/vendingMachine.ts
export const VM_JSON = {
  // 복사 붙여넣기
};
```

- `import { VM_JSON } from "@/abi/VendingMachine";`

##### (2) Smart Contract Address

```shell
npx hardhat run deploy/deploy.ts --network ganache
```

- components/VendingMachine.tsx

```tsx title=components/VendingMachine.tsx
const VM_CA=0x...
```

##### (3) Smart Contract와 연결하기

- components/VendingMachine.tsx

```tsx title=components/VendingMachine.tsx
import { ethers } from "ethers";
```

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

##### (5) 컵케이크 구매하기

```tsx
const handleClickBuy = async () => {
  console.log(amount);
};
```

```tsx
<Input
  id="amount"
  required
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
/>

<Button className="w-full" onClick={handleClickBuy}>
	구매하기
</Button>
```

- 브라우저 console에 amout 출력되는 것 확인

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

##### (6) 리필하기

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
