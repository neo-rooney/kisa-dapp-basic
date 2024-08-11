import { ethers } from "hardhat";

async function getBalance() {
  try {
    const contractAddress = "";

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
