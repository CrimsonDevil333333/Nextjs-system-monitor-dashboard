"use client";

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Skip nav on login — login has its own centered layout
  if (pathname?.startsWith('/login')) return <>{children}</>;
  return <Navigation>{children}</Navigation>;
}
