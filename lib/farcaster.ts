import { FrameRequest } from "@coinbase/onchainkit";
import { createPublicClient, getContract, http } from "viem";
import { optimism } from "viem/chains";
import { getSSLHubRpcClient, Message } from "@farcaster/hub-nodejs";

export const FRAME_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://";
const ID_REGISTRY_CONTRACT_ADDRESS: `0x${string}` =
  "0x00000000fc6c5f01fc30151999387bb99a9f489b";
const ZERO_ADDRESS: `0x${string}` =
  "0x0000000000000000000000000000000000000000";
const HUB_URL = "nemes.farcaster.xyz:2283";
const image1 = "";
//create images for our frames (using privy's image as placeholder)
export enum FrameImageUrls {
  START = `${process.env.NEXT_PUBLIC_GATEWAY}/ipfs/QmYBJEAAssoT61Ydatx64zwYGsT1aW2SmJbbky2fnzLBsG` as unknown as number,
  WALLET = `${process.env.NEXT_PUBLIC_GATEWAY}/ipfs/QmTawbdS3wD3JrMqrWykFCDaCFrHRn2ZrYxa61m3f2KVdE` as unknown as number,
  SUCCESS = "https://privy-frames-demo.vercel.app/success.png",
  ERROR = `${process.env.NEXT_PUBLIC_GATEWAY}/ipfs/QmTxGNw3wd5bB7NneWoshQNj44fLTtq1f5NfAEV6tXKMhR` as unknown as number,
}

export const createFrame = (
  imageUrl: string,
  buttonText: string,
  apiPath: string,
  isRedirect = false,
  isChat = false
) => {
  return `
        <!DOCTYPE html>
        <html>
            <head>
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="${imageUrl}">
            <meta name="fc:frame:post_url" content="${FRAME_BASE_URL}/${apiPath}">
            ${isChat && "<meta name='fc:frame:button:1', content='⬅️'>"}
            ${isChat && "<meta name='fc:frame:button:2', content='➡️'>"}
            <meta name="fc:frame:button:${
              isChat ? "3" : "1"
            }" content="${buttonText}">
            ${
              isChat &&
              "<meta name='fc:frame:input:text', content='Type something here'>"
            }       
            <meta name="fc:frame:button:${
              !isChat ? "1" : "3"
            }:action" content="${isRedirect ? "post_redirect" : "post"}">
          
            </head>
        </html>`;
};

export const createWalletFrame = (address: string) => {
  return createFrame(
    FrameImageUrls.WALLET as any,
    "Mint a Chat",
    `api/mint/${address}`
  );
};

export const chatFrame = (image: string) =>
  createFrame(image, "Send", "api/done", true, true);

export const successFrame = createFrame(
  FrameImageUrls.SUCCESS,
  "Done",
  "api/done",
  true
);
export const errorFrame = createFrame(
  FrameImageUrls.ERROR as any,
  "Try again?",
  "api/wallet"
);

export const parseFrameRequest = async (request: FrameRequest) => {
  const hub = getSSLHubRpcClient(HUB_URL);
  let fid: number | undefined;
  let isValid: boolean = true;

  try {
    const decodedMessage = Message.decode(
      Buffer.from(request.trustedData.messageBytes, "hex")
    );
    const result = await hub.validateMessage(decodedMessage);
    if (!result.isOk() || !result.value.valid || !result.value.message) {
      isValid = false;
    } else {
      fid = result.value.message.data?.fid;
    }
  } catch (error) {
    console.error(error);
  }

  return { fid: fid, isValid: isValid };
};

export const getOwnerAddressFromFid = async (fid: number) => {
  let ownerAddress: `0x${string}` | undefined;
  try {
    const publicClient = createPublicClient({
      chain: optimism,
      transport: http(),
    });
    const idRegistry = getContract({
      address: ID_REGISTRY_CONTRACT_ADDRESS,
      abi: [
        {
          inputs: [{ internalType: "uint256", name: "fid", type: "uint256" }],
          name: "custodyOf",
          outputs: [
            { internalType: "address", name: "owner", type: "address" },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      client: publicClient,
    });
    ownerAddress = await idRegistry.read.custodyOf([BigInt(fid)]);
  } catch (error) {
    console.error(error);
  }
  return ownerAddress !== ZERO_ADDRESS ? ownerAddress : undefined;
};
