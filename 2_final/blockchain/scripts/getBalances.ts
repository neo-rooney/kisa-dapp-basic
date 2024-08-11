import { ethers } from "hardhat";

async function getBalance() {
  try {
    const contractAddress = "0x3C7584E108036e533C75F2Db3f7525e2c9A3eB79";

    const vendingMachine = await ethers.getContractAt(
      "VendingMachine",
      contractAddress
    );

    let balance = await vendingMachine.cupcakeBalances(contractAddress);
    console.log("Cupcake balance of contract:", balance.toString());
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
}

getBalance();
