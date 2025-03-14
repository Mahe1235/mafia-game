import type { Metadata } from "next";
import "./globals.css";

import { cn } from "@/lib/utils";
import { GraphQLClientProvider } from "@/graphql/client";
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';

// Force dynamic server-side rendering for this layout
export const dynamic = 'force-dynamic';

// Using className instead of font variable
const fontClasses = "font-sans";

export const metadata: Metadata = {
  title: "Mafia Game",
  description: "A multiplayer social deduction game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body 
        className={cn(
          "min-h-screen bg-background antialiased",
          fontClasses
        )}
        suppressHydrationWarning
      >
        <GraphQLClientProvider>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
            <ConnectionStatus />
          </div>
        </GraphQLClientProvider>
      </body>
    </html>
  );
}
