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
    <html lang="en">
      <body suppressHydrationWarning>
        <GraphQLProvider>
          <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            {children}
            <ConnectionStatus />
          </main>
        </GraphQLProvider>
      </body>
    </html>
  )
}
