import Web3 from "web3";
import starNotaryArtifact from "../../build/contracts/StarNotary.json";

const App = {
  web3: null,
  account: null,
  meta: null,
  start: async function () {
    const { web3 } = this;
    try {
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = starNotaryArtifact.networks[networkId];
      this.meta = new web3.eth.Contract(
        starNotaryArtifact.abi,
        deployedNetwork.address
      );
      const accounts = await web3.eth.getAccounts();
      this.account = accounts[0];
    } catch (error) {
      console.error("Could not connect to contract or chain.");
    }
  },
  setStatus: function (message) {
    const status = document.getElementById("status");
    status.innerHTML = message;
  },
  createStar: async function () {
    const { createStar } = this.meta.methods;
    const name = document.getElementById("starName").value;
    const id = document.getElementById("starId").value;
    await createStar(name, id).send({ from: this.account });
    App.setStatus("New star owner is " + this.account + ".");
  },
  lookUp: async function () {
    const { getRegistryEntry } = this.meta.methods;
    const tokenId = document.getElementById("lookId").value;
    const starName = await getRegistryEntry(tokenId).call();
    App.setStatus("Star name is " + String(starName) + ".");
  },
};

window.App = App;

window.addEventListener("load", async function () {
  if (window.ethereum) {
    App.web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
  } else {
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://127.0.0.1:9545")
    );
  }
  App.start();
});
