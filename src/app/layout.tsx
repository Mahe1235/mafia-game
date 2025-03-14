import { GraphQLProvider } from '@/components/providers/GraphQLProvider';
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <GraphQLProvider>
          {children}
        </GraphQLProvider>
      </body>
    </html>
  )
}
