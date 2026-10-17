import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Crimson_Text, MedievalSharp } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sans",
});

const medievalSharp = MedievalSharp({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Gunter's Forge",
  description: "Gunter's Forge",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        crimsonText.variable,
        medievalSharp.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
