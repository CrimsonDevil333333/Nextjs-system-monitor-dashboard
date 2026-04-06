"use client";

import dynamic from 'next/dynamic';

const Navigation = dynamic(() => import('@/components/Navigation'), { ssr: false });

export default function Template({ children }: { children: React.ReactNode }) {
  return <Navigation>{children}</Navigation>;
}
