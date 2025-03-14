import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Game | Mafia Game',
  description: 'Create a new Mafia game room',
};

/**
 * Layout for the create game page
 * Provides server-side rendering context
 */
export default function CreateGameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 