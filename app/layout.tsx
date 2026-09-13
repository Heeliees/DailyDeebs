import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Deebs — The Daily Dead by Daylight Quiz",
  description: "Identify a Dead by Daylight perk, item, add-on and offering from their icons. Four questions, one trial every day.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
