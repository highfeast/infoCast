// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChatNFT is ERC721, Ownable(msg.sender) {
    mapping(address => bytes) private userConversationIds;
    uint256 private totalTokens;

    event NewConversation(address indexed user, bytes conversationId);

    constructor() ERC721("InfoCast CHAT", "iCHAT") {}

    function mintAndAssignConversationId(address user) external onlyOwner {
        totalTokens++;
        _safeMint(user, totalTokens);
        bytes memory conversationId = abi.encodePacked(user, totalTokens);
        userConversationIds[user] = conversationId;
        emit NewConversation(user, conversationId);
    }

    function getUserConversationId(
        address user
    ) external view returns (bytes memory) {
        return userConversationIds[user];
    }
}
