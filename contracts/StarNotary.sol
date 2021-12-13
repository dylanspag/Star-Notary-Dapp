// SPDX-License-Identifier: CC BY-NC-ND 4.0
pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract StarNotary is ERC721 {
    struct Star {
        string name;
    }

    string public name;
    string public symbol;
    mapping(uint256 => Star) public registry;
    mapping(uint256 => uint256) public listings;

    constructor(string memory name_, string memory symbol_) public {
        name = name_;
        symbol = symbol_;
    }

    function getRegistryEntry(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return registry[tokenId].name;
    }

    function createStar(string memory starName, uint256 tokenId) public {
        Star memory newStar = Star(starName);
        registry[tokenId] = newStar;
        _mint(msg.sender, tokenId);
    }

    function buyStar(uint256 tokenId) public payable {
        require(listings[tokenId] > 0, "Star is not currently for sale.");
        uint256 price = listings[tokenId];
        address ownerAddress = ownerOf(tokenId);
        require(msg.value > price, "Buyer does not have enough Ether.");
        _safeTransferFrom(ownerAddress, msg.sender, tokenId, "");
        address payable payableOwnerAddress = _make_payable(ownerAddress);
        payableOwnerAddress.transfer(price);
        msg.sender.transfer(msg.value - price);
        listings[tokenId] = 0;
    }

    function exchangeStars(uint256 tokenId1, uint256 tokenId2) public {
        address star1Owner = ownerOf(tokenId1);
        address star2Owner = ownerOf(tokenId2);
        bool isStarOwner = msg.sender == star1Owner || msg.sender == star2Owner;
        require(isStarOwner, "Sender must own one of the two tokens.");
        safeTransferFrom(star1Owner, star2Owner, tokenId1);
        safeTransferFrom(star2Owner, star1Owner, tokenId2);
    }

    function putStarUpForSale(uint256 tokenId, uint256 price) public {
        bool isOwner = msg.sender == ownerOf(tokenId);
        require(isOwner, "Star is not owned by seller.");
        listings[tokenId] = price;
    }

    function transferStar(address to, uint256 tokenId) public {
        bool isOwner = msg.sender == ownerOf(tokenId);
        require(isOwner, "Sender is not star owner.");
        safeTransferFrom(msg.sender, to, tokenId);
    }

    function _make_payable(address x) internal pure returns (address payable) {
        return address(uint160(x));
    }
}
