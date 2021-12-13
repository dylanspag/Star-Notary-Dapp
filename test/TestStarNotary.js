const StarNotary = artifacts.require("StarNotary");
const truffleAssert = require("truffle-assertions");
const reverts = truffleAssert.reverts;

contract("StarNotary", (accs) => {
  accounts = accs;
  owner = accounts[0];
});

it("Test that the Star Notary's name and symbol are set.", async () => {
  let expectedName = "Rinkeby Star Tokens";
  let expectedSymbol = "RST";
  let contract = await StarNotary.new(expectedName, expectedSymbol);
  assert.equal(await contract.name(), expectedName);
  assert.equal(await contract.symbol(), expectedSymbol);
});

it("Test that a star is added to the registry when minted.", async () => {
  let contract = await StarNotary.deployed();
  let user = accounts[0];
  let starId = 1;
  let starName = `Test Star ${starId}`;
  await contract.createStar(starName, starId, { from: user });
  let regisryEntry = await contract.getRegistryEntry.call(starId);
  assert.equal(regisryEntry, starName);
});

it("Tests that seller receives payment after sale.", async () => {
  let contract = await StarNotary.deployed();
  let seller = accounts[1];
  let buyer = accounts[2];
  let starId = 2;
  let starName = `Test Star ${starId}`;
  let price = web3.utils.toWei("0.01", "ether");
  let buyerBalance = web3.utils.toWei("0.05", "ether");
  await contract.createStar(starName, starId, { from: seller });
  await contract.putStarUpForSale(starId, price, { from: seller });
  let sellerBalanceBeforeSale = await web3.eth.getBalance(seller);
  await contract.buyStar(starId, { from: buyer, value: buyerBalance });
  let sellerBalanceAfterSale = await web3.eth.getBalance(seller);
  let expectedBalance = Number(sellerBalanceBeforeSale) + Number(price);
  let actualBalance = Number(sellerBalanceAfterSale);
  assert.equal(actualBalance, expectedBalance);
});

it("Tests that the buyer's balance decreases after purchase.", async () => {
  let contract = await StarNotary.deployed();
  let seller = accounts[1];
  let buyer = accounts[2];
  let starId = 3;
  let starName = `Test Star ${starId}`;
  let price = web3.utils.toWei("0.01", "ether");
  let buyerBalance = web3.utils.toWei("0.05", "ether");
  await contract.createStar(starName, starId, { from: seller });
  await contract.putStarUpForSale(starId, price, { from: seller });
  let buyerBalanceBeforePurchase = await web3.eth.getBalance(buyer);
  await contract.buyStar(starId, {
    from: buyer,
    value: buyerBalance,
    gasPrice: 0,
  });
  const buyerBalanceAfterPurchase = await web3.eth.getBalance(buyer);
  let expectedBalance = Number(buyerBalanceBeforePurchase) - Number(price);
  let actualBalance = Number(buyerBalanceAfterPurchase);
  assert.equal(actualBalance, expectedBalance);
});

it("Tests that a star is transferred to the buyer after sale.", async () => {
  let contract = await StarNotary.deployed();
  let buyer = accounts[1];
  let seller = accounts[2];
  let starId = 4;
  let starName = `Test Star ${starId}`;
  let price = web3.utils.toWei("0.01", "ether");
  let buyerBalance = web3.utils.toWei("0.05", "ether");
  await contract.createStar(starName, starId, { from: seller });
  await contract.putStarUpForSale(starId, price, { from: seller });
  await contract.buyStar(starId, { from: buyer, value: buyerBalance });
  let owner = await contract.ownerOf.call(starId);
  assert.equal(owner, buyer);
});

it("Tests that a star is removed from listings after sale.", async () => {
  let contract = await StarNotary.deployed();
  let buyer = accounts[1];
  let seller = accounts[2];
  let starId = 5;
  let starName = `Test Star ${starId}`;
  let price = web3.utils.toWei("0.01", "ether");
  let buyerBalance = web3.utils.toWei("0.05", "ether");
  await contract.createStar(starName, starId, { from: seller });
  await contract.putStarUpForSale(starId, price, { from: seller });
  await contract.buyStar(starId, { from: buyer, value: buyerBalance });
  let listedPrice = await contract.listings.call(starId);
  assert.equal(listedPrice, 0);
});

it("Tests that a purchase without enough Ether is reverted.", async () => {
  let contract = await StarNotary.deployed();
  let buyer = accounts[1];
  let seller = accounts[2];
  let starId = 6;
  let starName = `Test Star ${starId}`;
  let price = web3.utils.toWei("0.01", "ether");
  let buyerBalance = web3.utils.toWei("0.005", "ether");
  await contract.createStar(starName, starId, { from: seller });
  await contract.putStarUpForSale(starId, price, { from: seller });
  await reverts(contract.buyStar(starId, { from: buyer, value: buyerBalance }));
});

it("Tests that a purchase of an unlisted star is reverted.", async () => {
  let contract = await StarNotary.deployed();
  let buyer = accounts[1];
  let starId = 0;
  let buyerBalance = web3.utils.toWei(".05", "ether");
  await reverts(contract.buyStar(starId, { from: buyer, value: buyerBalance }));
});

it("Tests that a user can make an exchange as the first owner.", async () => {
  let contract = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starAId = 7;
  let starBId = 8;
  let starAName = `Test Star ${starAId}`;
  let starBName = `Test Star ${starBId}`;
  await contract.createStar(starAName, starAId, { from: user1 });
  await contract.createStar(starBName, starBId, { from: user2 });
  await contract.approve(user1, starBId, { from: user2 });
  await contract.exchangeStars(starAId, starBId, { from: user1 });
  let starAOwner = await contract.ownerOf.call(starAId);
  let starBOwner = await contract.ownerOf.call(starBId);
  assert.equal(starAOwner, user2);
  assert.equal(starBOwner, user1);
});

it("Tests that a user can make an exchange as the second owner.", async () => {
  let contract = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starAId = 9;
  let starBId = 10;
  let starAName = `Test Star ${starAId}`;
  let starBName = `Test Star ${starBId}`;
  await contract.createStar(starAName, starAId, { from: user1 });
  await contract.createStar(starBName, starBId, { from: user2 });
  await contract.approve(user1, starBId, { from: user2 });
  await contract.exchangeStars(starBId, starAId, { from: user1 });
  let starAOwner = await contract.ownerOf.call(starAId);
  let starBOwner = await contract.ownerOf.call(starBId);
  assert.equal(starAOwner, user2);
  assert.equal(starBOwner, user1);
});

it("Tests that the sender can make an exchange with themself.", async () => {
  let contract = await StarNotary.deployed();
  let user = accounts[1];
  let starAId = 11;
  let starBId = 12;
  let starAName = `Test Star ${starAId}`;
  let starBName = `Test Star ${starBId}`;
  await contract.createStar(starAName, starAId, { from: user });
  await contract.createStar(starBName, starBId, { from: user });
  await contract.exchangeStars(starBId, starAId, { from: user });
  let starAOwner = await contract.ownerOf.call(starAId);
  let starBOwner = await contract.ownerOf.call(starBId);
  assert.equal(starAOwner, user);
  assert.equal(starBOwner, user);
});

it("Tests that the sender cannot make an unapproved exchange.", async () => {
  let contract = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starAId = 13;
  let starBId = 14;
  let starAName = `Test Star ${starAId}`;
  let starBName = `Test Star ${starBId}`;
  await contract.createStar(starAName, starAId, { from: user1 });
  await contract.createStar(starBName, starBId, { from: user2 });
  await reverts(contract.exchangeStars(starAId, starBId, { from: user1 }));
});

it("Test that a user can put their star up for sale.", async () => {
  let contract = await StarNotary.deployed();
  let user = accounts[0];
  let starId = 15;
  let starName = `Test Star ${starId}`;
  let expectedPrice = web3.utils.toWei("0.01", "ether");
  await contract.createStar(starName, starId, { from: user });
  await contract.putStarUpForSale(starId, expectedPrice, { from: user });
  let listedPrice = await contract.listings.call(starId);
  assert.equal(listedPrice, expectedPrice);
});

it("Tests that a user must own a star to put it up for sale.", async () => {
  let contract = await StarNotary.deployed();
  let user1 = accounts[0];
  let user2 = accounts[1];
  let starId = 16;
  let starName = `Test Star ${starId}`;
  let price = web3.utils.toWei("0.01", "ether");
  await contract.createStar(starName, starId, { from: user1 });
  await reverts(contract.putStarUpForSale(starId, price, { from: user2 }));
});

it("Tests that a user can transfer their star to another user.", async () => {
  let contract = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let starId = 17;
  let starName = `Test Star ${starId}`;
  await contract.createStar(starName, starId, { from: user1 });
  await contract.transferStar(user2, starId, { from: user1 });
  assert.equal(await contract.ownerOf.call(starId), user2);
});

it("Tests that a user cannot transfer another user's star.", async () => {
  let contract = await StarNotary.deployed();
  let user1 = accounts[1];
  let user2 = accounts[2];
  let user3 = accounts[3];
  let starId = 18;
  let starName = `Test Star ${starId}`;
  await contract.createStar(starName, starId, { from: user1 });
  await reverts(contract.transferStar(user3, starId, { from: user3 }));
});
