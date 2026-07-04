import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "HPAS",
  description: "Customer engagement for your shop",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
