import {
  errorFrame,
  parseFrameRequest,
  getOwnerAddressFromFid,
  successFrame,
  chatFrame,
} from "@/lib/farcaster";
import { FrameRequest } from "@coinbase/onchainkit";
import { NextRequest, NextResponse } from "next/server";
import { airdropTo } from "@/lib/nft";

export async function POST(req: NextRequest): Promise<Response> {
  let frameRequest: FrameRequest | undefined;
  // Parse and validate request from Frame for fid
  try {
    frameRequest = await req.json();
    if (!frameRequest)
      throw new Error("Could not deserialize request from frame");
  } catch (e) {
    return new NextResponse(errorFrame);
  }

  const { fid, isValid } = await parseFrameRequest(frameRequest);
  if (!fid || !isValid) return new NextResponse(errorFrame);

  const address = req.url.split("/").slice(-1)[0];
  if (typeof address !== "string") return new NextResponse(errorFrame);

  // Airdrop NFT to the user's wallet
  // const tx = await airdropTo(address as `0x${string}`);
  // if (!tx) return new NextResponse(errorFrame);

  //pass image here

  //check if a user is curently an NFT holder
  //if the user isn't, then it's time for us to mint for the user

  // we'll do the checking on the wallet place,
  // if the user holds a mint, then we'll direct the user immediately to message

  return new NextResponse(
    chatFrame("https://privy-frames-demo.vercel.app/wallet.png")
  );
}

export const dynamic = "force-dynamic";
