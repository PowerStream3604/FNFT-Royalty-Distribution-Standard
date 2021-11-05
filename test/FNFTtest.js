const assert = require('chai').assert;
const ethers = require('ethers');
const TargetNFT = artifacts.require("TargetNFT");
const FNFT = artifacts.require("FNFT");

contract("Fractional NFT with On-Chain Royalty Distribution System", (accounts) => {
    // Init Users
    const user1 = accounts[0];
    const user2 = accounts[1];
    const user3 = accounts[2];
    const user4 = accounts[3];

    it("Mint NFTs", async () => {
        const targetNFT = await TargetNFT.deployed();
        // Mint NFT
        await targetNFT.safeMint(user2, 1);
        await targetNFT.safeMint(user3, 2);

        // Fetch Owner Address
        const owner1 = await targetNFT.ownerOf(1);
        const owner2 = await targetNFT.ownerOf(2);

        await assert.equal(user2, owner1);
        await assert.equal(user3, owner2);
    });

    it("Basic FNFT Contract Test", async () => {

        const fNft = await FNFT.new(1000, {from: user1});

        const balance = await fNft.balanceOf(user1);
        console.log("       Balance : ", parseInt(balance));

        const index = await fNft.getIndex({from: user1});
        console.log("       userIndex : ", parseInt(index));

        const totalSupply = await fNft.getTotalSupply({from: user1});
        console.log("       Total Supply : ", parseInt(totalSupply));

        const arrayLength = await fNft.getLength({from: user1});
        console.log("       userInfo length : ", parseInt(arrayLength));

        const royaltyCounter = await fNft.getRoyaltyCounter({from: user1});
        console.log("       royaltyCounter : ", parseInt(royaltyCounter));

        const zeroIndexBalance = await fNft.getZeroBalance({from: user1});
        console.log("       zeroBalance : ", parseInt(zeroIndexBalance));

        const showBalance = await fNft.showBalance({from: user1});
        console.log("       showBalance : ", parseInt(showBalance));

        const contractRoyaltyCounter = await fNft.getContractRoyaltyCounter({from: user1});
        console.log("       royaltyCounter : ", parseInt(contractRoyaltyCounter));

        await assert.equal(balance, 1000);

    });

    it("ERC165 supportInterface() test with FNFT Token", async () => {
        const fNft = await FNFT.new(1000, {from: user1});

        const isFNFT = await fNft.supportsInterface('0xdb453760');

        await assert.equal(isFNFT, true);
    });

    it("Verify if FNFT's claim of NFT Ownership is true", async () => {
        const targetNFT = await TargetNFT.deployed();

        // Mint NFT for fractionalization
        const tokenId = 4;
        await targetNFT.safeMint(user2, tokenId);
        const nftOwner = await targetNFT.ownerOf(tokenId);
        await assert.equal(user2, nftOwner);

        // Deploy RFT
        const fNft = await FNFT.new(1000, {from: user1});

        // Sets the Address & TokenID of NFT to FNFT Contract
        await fNft.setTargetNFT(targetNFT.address, tokenId);

        // Send ownership of NFT(TokenID=4) to FNFT
        await targetNFT.safeTransferFrom(user2, fNft.address, tokenId, {from: user2});

        const targetToken = await fNft.targetNFT();
        const { 0: nftContract, 1: nftTokenId } = targetToken;
        await assert.equal(targetNFT.address, nftContract);
        await assert.equal(fNft.address, await targetNFT.ownerOf(nftTokenId));
    });

    it("Should be able to send royalty to FNFT", async () => {
        const targetNFT = await TargetNFT.deployed();

        // Mint NFT for fractionalization
        const tokenId = 5;
        await targetNFT.safeMint(user2, tokenId);

        const nftOwner = await targetNFT.ownerOf(tokenId);
        await assert.equal(user2, nftOwner);

        // Deploy FNFT
        const fNft = await FNFT.new(1000, {from: user1});

        // Sets the Address & TokenID of NFT to FNFT Contract
        await fNft.setTargetNFT(targetNFT.address, tokenId);

        // Send ownership of NFT(TokenID=4) to FNFT
        await targetNFT.safeTransferFrom(user2, fNft.address, tokenId, {from: user2});

        const targetToken = await fNft.targetNFT();
        const { 0: nftContract, 1: nftTokenId } = targetToken;

        await assert.equal(targetNFT.address, nftContract);
        await assert.equal(fNft.address, await targetNFT.ownerOf(nftTokenId));

        await fNft.sendRoyalty({from: user3, value: await ethers.utils.parseEther('3')});

        const royaltyCounter = await fNft.getContractRoyaltyCounter();
        await assert.equal(royaltyCounter, 1);
    });

    it("Should be able to withdraw royalty received", async () => {
        const targetNFT = await TargetNFT.deployed();

        // Mint NFT for fractionalization
        const tokenId = 6;
        await targetNFT.safeMint(user2, tokenId);

        const nftOwner = await targetNFT.ownerOf(tokenId);
        await assert.equal(user2, nftOwner);

        // Deploy FNFT
        const fNft = await FNFT.new(1000, {from: user1});

        // Sets the Address & TokenID of NFT to FNFT Contract
        await fNft.setTargetNFT(targetNFT.address, tokenId);

        // Send ownership of NFT(TokenID=4) to FNFT
        await targetNFT.safeTransferFrom(user2, fNft.address, tokenId, {from: user2});

        const targetToken = await fNft.targetNFT();
        const { 0: nftContract, 1: nftTokenId } = targetToken;

        await assert.equal(targetNFT.address, nftContract);
        await assert.equal(fNft.address, await targetNFT.ownerOf(nftTokenId));

        await fNft.sendRoyalty({from: user3, value: await ethers.utils.parseEther('3')});

        const royaltyCounter = await fNft.getContractRoyaltyCounter();
        await assert.equal(royaltyCounter, 1);

        const provider = await ethers.getDefaultProvider("http://localhost:8545");
        const balanceBefore = await provider.getBalance(user1);
        console.log("       Balance Before Withdrawal : ", ethers.utils.formatEther(balanceBefore));

        await fNft.withdrawRoyalty({from: user1});
        const balanceAfter = await provider.getBalance(user1);
        console.log("       Balance After Withdrawal : ", ethers.utils.formatEther(balanceAfter));
        console.log("       Expected : ", (parseFloat(ethers.utils.formatEther(balanceBefore)) + parseFloat('3')).toFixed(2));
        await assert.equal((parseFloat(ethers.utils.formatEther(balanceBefore)) + parseFloat('3')).toFixed(2), Number.parseFloat(ethers.utils.formatEther(balanceAfter)).toFixed(2));
    });

    it("Should be able to distribute royalty according to share", async () => {
        const targetNFT = await TargetNFT.deployed();

        // Mint NFT for fractionalization
        const tokenId = 7;
        await targetNFT.safeMint(user2, tokenId);

        const nftOwner = await targetNFT.ownerOf(tokenId);
        await assert.equal(user2, nftOwner);

        // Deploy FNFT
        const fNft = await FNFT.new(1000, {from: user1});

        // Sets the Address & TokenID of NFT to FNFT Contract
        await fNft.setTargetNFT(targetNFT.address, tokenId);

        // Send ownership of NFT(TokenID=4) to FNFT
        await targetNFT.safeTransferFrom(user2, fNft.address, tokenId, {from: user2});

        const targetToken = await fNft.targetNFT();
        const { 0: nftContract, 1: nftTokenId } = targetToken;

        await assert.equal(targetNFT.address, nftContract);
        await assert.equal(fNft.address, await targetNFT.ownerOf(nftTokenId));

        const tokenShare = 333;
        // Send 333 to User2
        await fNft.transfer(user2, tokenShare, {from: user1});
        const user2Balance = await fNft.balanceOf(user2);
        await assert.equal(parseInt(user2Balance), tokenShare);

        // Send 333 to User3
        await fNft.transfer(user3, tokenShare, {from: user1});
        const user3Balance = await fNft.balanceOf(user3);
        await assert.equal(parseInt(user3Balance), tokenShare);

        // Get User1 Balance
        const user1Balance = await fNft.balanceOf(user1);
        await assert.equal(parseInt(user1Balance), 1000 - 333 - 333);

        await fNft.sendRoyalty({from: user3, value: await ethers.utils.parseEther('3')});

        const royaltyCounter = await fNft.getContractRoyaltyCounter();
        await assert.equal(royaltyCounter, 1);

        console.log("       -------------User1---------------");
        const provider = await ethers.getDefaultProvider("http://localhost:8545");
        let balanceBefore = await provider.getBalance(user1);
        console.log("       Balance Before Withdrawal : ", ethers.utils.formatEther(balanceBefore));

        await fNft.withdrawRoyalty({from: user1});
        let balanceAfter = await provider.getBalance(user1);
        console.log("       Balance After Withdrawal : ", ethers.utils.formatEther(balanceAfter));
        console.log("       Expected : ", (parseFloat(ethers.utils.formatEther(balanceBefore)) + parseFloat('1')).toFixed(2));
        await assert.equal((parseFloat(ethers.utils.formatEther(balanceBefore)) + parseFloat('1')).toFixed(2), Number.parseFloat(ethers.utils.formatEther(balanceAfter)).toFixed(2));


        console.log("       -------------User2---------------");
        balanceBefore = await provider.getBalance(user2);
        console.log("       Balance Before Withdrawal : ", ethers.utils.formatEther(balanceBefore));
        await fNft.withdrawRoyalty({from: user2});

        balanceAfter = await provider.getBalance(user2);
        console.log("       Balance After Withdrawal : ", ethers.utils.formatEther(balanceAfter));
        console.log("       Expected : ", (parseFloat(ethers.utils.formatEther(balanceBefore)) + parseFloat('1')).toFixed(2));
        await assert.equal((parseFloat(ethers.utils.formatEther(balanceBefore)) + parseFloat('1')).toFixed(2), Number.parseFloat(ethers.utils.formatEther(balanceAfter)).toFixed(2));

        console.log("       -------------User3---------------");
        balanceBefore = await provider.getBalance(user3);
        console.log("       Balance Before Withdrawal : ", ethers.utils.formatEther(balanceBefore));
        await fNft.withdrawRoyalty({from: user3});

        balanceAfter = await provider.getBalance(user3);
        console.log("       Balance After Withdrawal : ", ethers.utils.formatEther(balanceAfter));
        console.log("       Expected : ", (parseFloat(ethers.utils.formatEther(balanceBefore)) + parseFloat('1')).toFixed(2));
        await assert.equal((parseFloat(ethers.utils.formatEther(balanceBefore)) + parseFloat('1')).toFixed(2), Number.parseFloat(ethers.utils.formatEther(balanceAfter)).toFixed(2));
    });

});