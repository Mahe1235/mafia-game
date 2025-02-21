'use client';

import { useSearchParams } from 'next/navigation';
import { JoinGame } from '@/components/game/JoinGame';

export default function JoinPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  
  return <JoinGame initialCode={code || ''} />;
}