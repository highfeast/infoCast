// pragma solidity 0.8.20;

// import { time, loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
// import { expect } from "chai";
// import hre from "hardhat";
// import { getAddress } from "viem";

// describe("ChatNFT", function () {
//   async function deployChatNFTFixture() {
//     const [owner] = await hre.viem.getWalletClients();
//     const chatNFT = await hre.viem.deployContract("ChatNFT", []);
//     return { chatNFT, owner };
//   }

//   describe("Deployment", function () {
//     it("Should set the correct initial state", async function () {
//       const { chatNFT } = await loadFixture(deployChatNFTFixture);
//       const totalTokens = await chatNFT.totalTokens();
//       expect(totalTokens).to.equal(0);
//     });

//     it("Should allow owner to mint and assign conversation ID", async function () {
//       const { chatNFT, owner } = await loadFixture(deployChatNFTFixture);
//       const ownerAddress = getAddress(owner);
//       await expect(chatNFT.mintAndAssignConversationId(ownerAddress))
//         .to.emit(chatNFT, "NewConversation")
//         .withArgs(ownerAddress, ethers.utils.solidityKeccak256(["address", "uint256"], [ownerAddress, 1]));

//       const ownerConversationId = await chatNFT.getUserConversationId(ownerAddress);
//       expect(ownerConversationId).to.equal(ethers.utils.solidityKeccak256(["address", "uint256"], [ownerAddress, 1]));
//     });
//   });

//   describe("getUserConversationId", function () {
//     it("Should return the correct conversation ID for a user", async function () {
//       const { chatNFT, owner } = await loadFixture(deployChatNFTFixture);
//       const ownerAddress = getAddress(owner);
//       await chatNFT.mintAndAssignConversationId(ownerAddress);

//       const ownerConversationId = await chatNFT.getUserConversationId(ownerAddress);
//       expect(ownerConversationId).to.equal(ethers.utils.solidityKeccak256(["address", "uint256"], [ownerAddress, 1]));
//     });

//     it("Should return an empty bytes32 for a user without a conversation ID", async function () {
//       const { chatNFT } = await loadFixture(deployChatNFTFixture);
//       const randomAddress = ethers.Wallet.createRandom().address;

//       const conversationId = await chatNFT.getUserConversationId(randomAddress);
//       expect(conversationId).to.equal("0x");
//     });
//   });
// });