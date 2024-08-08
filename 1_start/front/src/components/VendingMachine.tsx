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
import { Label } from "@radix-ui/react-label";

const VendingMachine = () => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">🎂 컵 케이크 머신</CardTitle>
        <CardDescription>지갑을 연결해주세요.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* 이 곳에 지갑 UI를 넣어주세요. */}
        <div className="grid gap-2">
          <Label htmlFor="email">남은 컵 케이크 개수</Label>
          <Input id="amount" />
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
  );
};

export default VendingMachine;
