"use client";

import ThemeRegistry from "@/components/ThemeRegistry";
import Navigation from "@/components/Navigation";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Navigation>{children}</Navigation>
        </ThemeRegistry>
      </body>
    </html>
  );
}
