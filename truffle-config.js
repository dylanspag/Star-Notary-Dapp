require("dotenv").config();
const HDWalletProvider = require("truffle-hdwallet-provider");

const MNEMONIC = process.env.MNEMONIC;
const RINKEBY_URL = process.env.RINKEBY_URL;

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    rinkeby: {
      provider: () => new HDWalletProvider(MNEMONIC, RINKEBY_URL),
      network_id: 4,
    },
  },
  mocha: {
    timeout: 5000,
  },
};
