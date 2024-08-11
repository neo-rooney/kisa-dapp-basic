import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWalletContext } from "@/contexts/WalletContext/WalletContext";
import { formatAddress } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Label } from "@radix-ui/react-label";
import { VM_JSON } from "@/abi/vendingMachine";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
const VM_CA = "0xf0b9bbcfa38b7adb9b4b337dcefc5387b6e1ab16";

const VendingMachine = () => {
  const {
    wallets,
    selectedWallet,
    selectedAccount,
    connectWallet,
    disconnectWallet,
  } = useWalletContext();

  const [contract, setContract] = useState<ethers.Contract>();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [owner, setIsOwner] = useState(false);
  const [myCupCake, setMyCupCake] = useState(0);

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

  return (
    <div className="w-full max-w-sm grid gap-2">
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle className="text-2xl">내 정보</CardTitle>
          </div>
          <CardDescription>
            {selectedAccount ? `🎂 ${myCupCake} 개` : "지갑을 연결해주세요."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid items-center gap-4">
          {Object.keys(wallets).length > 0 ? (
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
                    {selectedWallet?.info.name === provider.info.name &&
                    selectedAccount
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
          )}
        </CardContent>
      </Card>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">🎂 컵 케이크 머신</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">남은 컵 케이크 개수</Label>
            <Input id="amount" value={balance} readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">구매할 컵 케이크 수량을 입력해주세요.</Label>
            <Input
              id="amount"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button className="w-full" onClick={handleClickBuy}>
            구매하기
          </Button>
          {owner && (
            <Button className="w-full" variant="outline">
              100개 리필하기
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default VendingMachine;
