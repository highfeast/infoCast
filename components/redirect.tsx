'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PRIVY_AUTH_DEMO_URL = `https://warpcast.com/~/developers/frames?url=https://infocaster.vercel.app`;

export default function RedirectToDemo() {
  const router = useRouter();
  useEffect(() => {
      router.push(PRIVY_AUTH_DEMO_URL);
  })
  return (
    <>
      <div>Info Cast</div>
    </>
  );
}
