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
import { testAirDrop } from "@/lib/NFTRPC";
import svg2img from "svg2img";
import fs from "fs";
import sharp from "sharp";
import pinataSDK from "@pinata/sdk";
import stream from "stream";

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

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
  // const tx = await testAirDrop(address as `0x${string}`);

  // console.log(tx);
  // if (!tx) return new NextResponse(errorFrame);

  const text = "Hi, how may I help you?";

  const svgContent = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
                        <rect width="400" height="200" fill="white"/>
                        <text x="50%" y="50%" font-size="20" fill="black" text-anchor="middle">${text}</text>
                    </svg>
                `;
  const svgStream = new stream.Readable();
  svgStream.push(svgContent);
  svgStream.push(null);

  // Convert SVG to PNG using sharp
  // const pngBuffer = await sharp(svgStream as any)
  //   .png()
  //   .toBuffer();
  // try {
  //   const { IpfsHash } = await pinata.pinFileToIPFS(pngBuffer, {
  //     pinataMetadata: {
  //       name: "start˘.png",
  //     },
  //   });
  //   console.log("ipfs hash", IpfsHash);
  // } catch (e) {
  //   console.log(e);
  //   return new NextResponse(errorFrame);
  // }

  const welcomeImage =
    `${process.env.NEXT_PUBLIC_GATEWAY}/ipfs/QmWknFN2GzpwXG3ASknvYZCMTcEJVwf1t3AxyEC6YLn6o5?pinataGatewayToken=${process.env.NEXT_PUBLIC_PINATA_TOKEN}` as unknown as number;

  return new NextResponse(chatFrame(welcomeImage as any));
}

export const dynamic = "force-dynamic";
