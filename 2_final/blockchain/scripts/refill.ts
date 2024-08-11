import { ethers } from "hardhat";

async function purchase() {
  try {
    const amount = 1;

    const contractAddress = "0x3C7584E108036e533C75F2Db3f7525e2c9A3eB79";

    const vendingMachine = await ethers.getContractAt(
      "VendingMachine",
      contractAddress
    );

    await vendingMachine.refill(amount);

    const balanceBigInt = await vendingMachine.cupcakeBalances(contractAddress);

    const balanceNumber = Number(balanceBigInt);
    console.log("balance >>", balanceNumber);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}

purchase();
