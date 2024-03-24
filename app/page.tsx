import { getFrameMessage, getFrameMetadata } from '@coinbase/onchainkit';
import type { Metadata } from 'next';
import { FrameImageUrls, FRAME_BASE_URL } from '../lib/farcaster';
import RedirectToDemo from '@/components/redirect';

const frameMetadata = getFrameMetadata({
  buttons: [{ label: "Let's Chat" }],
  image: FrameImageUrls.START as any,
  post_url: `${FRAME_BASE_URL}/api/wallet`,
});

const campanyName = '';

export const metadata: Metadata = {
  title: 'InfoCast Frames',
  description: 'InfoCast Frame',
  openGraph: {
    title: 'InfoCast Frames',
    description: 'InfoCast Frames',
    images: [FrameImageUrls.START as any],
  },
  other: {
    ...frameMetadata,
  },
};

export default function Page() {
  return (
    <>
      <h1>Privy Frames</h1>
      <RedirectToDemo />
    </>
  );
}
