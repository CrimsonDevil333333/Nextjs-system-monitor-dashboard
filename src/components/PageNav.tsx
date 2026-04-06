"use client";
import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function PageNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/login')) return <>{children}</>;
  return <Navigation>{children}</Navigation>;
}
