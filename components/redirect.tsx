'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PRIVY_AUTH_DEMO_URL = '';

export default function RedirectToDemo() {
  const router = useRouter();
  // useEffect(() => {
  //     router.push(PRIVY_AUTH_DEMO_URL);
  // })
  return (
    <>
      <div>Info Cast</div>
    </>
  );
}
