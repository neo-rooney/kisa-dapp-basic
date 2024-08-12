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
import { VM_JSON } from "@/abi/json";
import { useEffect, useState } from "react";
const VM_CA = "";
import { ethers } from "ethers";

const VendingMachine = () => {
  // const {
  //   wallets,
  //   connectWallet,
  //   selectedAccount,
  //   selectedWallet,
  //   disconnectWallet,
  // } = useWalletContext();

  const [contract, setContract] = useState<ethers.Contract>();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [owner, setIsOwner] = useState(false);
  const [myCupCake, setMyCupCake] = useState(0);

  return (
    <div className="w-full max-w-sm grid gap-2">
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle className="text-2xl">내 정보</CardTitle>
          </div>
          <CardDescription>지갑을 연결해주세요.</CardDescription>
        </CardHeader>
        <CardContent className="grid items-center gap-4">
          {/* 지갑 UI 추가 되는 부분 */}
        </CardContent>
      </Card>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">🎂 컵 케이크 머신</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">남은 컵 케이크 개수</Label>
            <Input id="amount" readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">구매할 컵 케이크 수량을 입력해주세요.</Label>
            <Input id="amount" required />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button className="w-full">구매하기</Button>
          <Button className="w-full" variant="outline">
            100개 리필하기
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VendingMachine;
