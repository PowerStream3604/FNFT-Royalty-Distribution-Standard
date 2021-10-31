const truffleAssert = require("truffle-assertions");
const assert = require('chai').assert;

const TargetNFT = artifacts.require("TargetNFT");
const RFT = artifacts.require("RFT");


contract("TargetNFT", (accounts) => {
    // Init Users
    const user1 = accounts[0];
    const user2 = accounts[1];
    const user3 = accounts[2];

    it("Mint NFTs", async () => {
        const targetNFT = await TargetNFT.deployed();
        // Mint Token 
        await targetNFT.safeMint(user2, 1);
        await targetNFT.safeMint(user3, 2);

        // Fetch Owner Address
        const owner1 = await targetNFT.ownerOf(1);
        const owner2 = await targetNFT.ownerOf(2);

        console.log("       Owner of Token Id 1 : ", owner1);
        console.log("       Owner of Token Id 2 : ", owner2);

        await assert.equal(user2, owner1);
        await assert.equal(user3, owner2);
    });

    it("Basic Re-FT Token Test", async () => {
        const rft = await RFT.new(1000, {from: user1});

        const balance = await rft.balanceOf(user1);

        await assert.equal(balance, 1000);
    });

    it("ERC165 supportInterface() test with Re-Fungible Token", async () => {
        const rft = await RFT.new(1000, {from: user1});

        const isRFT = await rft.supportsInterface('0x01ffc9a7');

        await assert.equal(isRFT, true);
    });

    it("Fractionalize NFT with ReFungible Token Standard(EIP-1633)", async () => {
        const targetNFT = await TargetNFT.deployed();

        // Mint NFT for fractionalization
        const tokenId = 3;
        await targetNFT.safeMint(user2, tokenId);
        const nftOwner = await targetNFT.ownerOf(tokenId);
        await assert.equal(user2, nftOwner);

        console.log("       NFT Contract Address : ", targetNFT.address);

        // Deploy RFT
        const rft = await RFT.new(1000, {from: user1});

        // Sets the Address & TokenID of NFT to RFT Contract
        await rft.setParentNFT(targetNFT.address, tokenId);

        // Fetch Parent Token Contract Address
        const parentToken = await rft.parentToken();
        console.log("       Parent Token Address : ", parentToken);
        await assert.equal(targetNFT.address, parentToken);

        // Fetch Parent Token Id
        const parentTokenId = await rft.parentTokenId();
        console.log("       Parent Token Id : ", parentTokenId.toString());
        await assert.equal(parentTokenId, tokenId);
    });

    it("Verify if RFT's claim of NFT Ownership is true", async () => {
        const targetNFT = await TargetNFT.deployed();

        // Mint NFT for fractionalization
        const tokenId = 4;
        await targetNFT.safeMint(user2, tokenId);
        const nftOwner = await targetNFT.ownerOf(tokenId);
        await assert.equal(user2, nftOwner);

        // Deploy RFT
        const rft = await RFT.new(1000, {from: user1});

        // Sets the Address & TokenID of NFT to RFT Contract
        await rft.setParentNFT(targetNFT.address, tokenId);     
        
        // Send ownership of NFT(TokenID=4) to RFT
        await targetNFT.safeTransferFrom(user2, rft.address, tokenId, {from: user2});

        const rftToken = await rft.parentToken();
        const rftTokenId = await rft.parentTokenId();

        //await assert.equal(rft.address, rftToken);
        await assert.equal(rft.address, await targetNFT.ownerOf(rftTokenId));

    });
});