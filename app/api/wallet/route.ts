import {
  errorFrame,
  parseFrameRequest,
  getOwnerAddressFromFid,
  successFrame,
  createWalletFrame,
  chatFrame,
} from '@/lib/farcaster';
import { FrameRequest } from '@coinbase/onchainkit';
import { NextRequest, NextResponse } from 'next/server';
import { createOrFindEmbeddedWalletForFid } from '@/lib/embedded-wallet';
import stream from 'stream';
import chatNFTClient from '../../../lib/NFTRPC';

export async function POST(req: NextRequest): Promise<Response> {
  let frameRequest: FrameRequest | undefined;

  // Parse and validate request from Frame for fid
  try {
    frameRequest = await req.json();
    if (!frameRequest)
      throw new Error('Could not deserialize request from frame');
  } catch {
    return new NextResponse(errorFrame);
  }
  const { fid, isValid } = await parseFrameRequest(frameRequest);
  if (!fid || !isValid) return new NextResponse(errorFrame);

  // Query FC Registry contract to get owner address from fid
  const ownerAddress = await getOwnerAddressFromFid(fid);
  if (!ownerAddress) return new NextResponse(errorFrame);

  // Generate an embedded wallet associated with the fid
  const embeddedWalletAddress = await createOrFindEmbeddedWalletForFid(
    fid,
    ownerAddress
  );
  if (!embeddedWalletAddress) return new NextResponse(errorFrame);

  const _chatNFTClient = new chatNFTClient();

  const tx = await _chatNFTClient.getUserConversationId(embeddedWalletAddress);
  // console.log(tx);
  if (tx !== '0x') {
    const welcomeImage = `${process.env.NEXT_PUBLIC_GATEWAY}/ipfs/QmWknFN2GzpwXG3ASknvYZCMTcEJVwf1t3AxyEC6YLn6o5`;
    return new NextResponse(chatFrame(welcomeImage as any));
  }
  return new NextResponse(createWalletFrame(embeddedWalletAddress));
}

export const dynamic = 'force-dynamic';
