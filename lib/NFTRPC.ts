import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
  getAddress,
  Transaction,
  TransactionRequest,
} from "viem";
import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts";
import type { Account } from "viem/accounts";
import CHAT_NFT_ABI from "./abi.json";
import { sepolia } from "viem/chains";

class ChatNFTClient {
  private account: Account | null = null;
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private publicClient: ReturnType<typeof createPublicClient> | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });

    this.account = privateKeyToAccount(
      getAddress(process.env.NFT_WALLET_PRIVATE_KEY as string)
    );

    this.walletClient = createWalletClient({
      chain: sepolia,
      transport: http(),
      account: this.account,
    });
  }

  public async mintAndAssignConversationId(userAddress: string) {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized");
    }

    const mintData = encodeFunctionData({
      abi: CHAT_NFT_ABI,
      functionName: "mintAndAssignConversationId",
      args: [userAddress],
    });

    const tx: any = await this.walletClient.sendTransaction({
      to: getAddress(process.env.NFT_CONTRACT_ADDRESS as string),
      data: mintData,
      account: this.account!,
      chain: sepolia,
    });

    console.log("Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    return tx;
    console.log("Transaction receipt:", receipt);
  }

  public async getUserConversationId(userAddress: string) {
    if (!this.publicClient) {
      throw new Error("Public client not initialized");
    }

    const conversationIdData = encodeFunctionData({
      abi: CHAT_NFT_ABI,
      functionName: "getUserConversationId",
      args: [userAddress],
    });

    const conversationId = await this.publicClient.readContract({
      address: getAddress(process.env.NFT_CONTRACT_ADDRESS as string),
      abi: CHAT_NFT_ABI,
      functionName: "getUserConversationId",
      args: [userAddress],
    });

    return conversationId;
  }
}

export async function testAirDrop(recipient: string) {
  try {
    const chatNFTClient = new ChatNFTClient();
    return await chatNFTClient.mintAndAssignConversationId(recipient);
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
