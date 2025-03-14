import { GraphQLProvider } from '@/components/providers/GraphQLProvider';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import './globals.css'

// Force dynamic server-side rendering for this layout
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mafia Game',
  description: 'A multiplayer social deduction game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body suppressHydrationWarning className="h-full">
        <GraphQLProvider>
          <main className="min-h-screen h-full bg-gray-800">
            {children}
            <ConnectionStatus />
          </main>
        </GraphQLProvider>
      </body>
    </html>
  )
}
