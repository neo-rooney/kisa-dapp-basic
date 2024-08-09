import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545/",
      accounts: [
        "0x3270a51baaa29e0168af6ebcea2304bb54bd690f98b576d77273baf06de5210c",
      ],
    },
  },
  solidity: "0.8.24",
};

export default config;
