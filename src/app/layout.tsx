import type { Metadata } from "next";
import ThemeRegistry from "@/components/ThemeRegistry";
import Navigation from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pi System Monitor",
  description: "Dashboard for Raspberry Pi 5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Navigation>
            {children}
          </Navigation>
        </ThemeRegistry>
      </body>
    </html>
  );
}
