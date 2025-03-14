'use client';

import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'failed' | 'unavailable';

export function ConnectionStatus() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [showStatus, setShowStatus] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Defensive check in case pusherClient is not available
    if (!pusherClient || !pusherClient.connection) {
      console.error('Pusher client not available');
      setHasError(true);
      return;
    }
    
    try {
      // Status colors based on state
      const updateStatus = (state: ConnectionState) => {
        setConnectionState(state);
        // Only show status on error states
        setShowStatus(state !== 'connected');
        
        // Auto-hide success after 3 seconds
        if (state === 'connected') {
          setTimeout(() => setShowStatus(false), 3000);
        }
      };
      
      // Initial state
      const initialState = pusherClient.connection.state as ConnectionState;
      updateStatus(initialState || 'connecting');
      
      // Listen for connection state changes
      const handleConnected = () => updateStatus('connected');
      const handleConnecting = () => updateStatus('connecting');
      const handleDisconnected = () => updateStatus('disconnected');
      const handleFailed = () => updateStatus('failed');
      const handleUnavailable = () => updateStatus('unavailable');
      
      pusherClient.connection.bind('connected', handleConnected);
      pusherClient.connection.bind('connecting', handleConnecting);
      pusherClient.connection.bind('disconnected', handleDisconnected);
      pusherClient.connection.bind('failed', handleFailed);
      pusherClient.connection.bind('unavailable', handleUnavailable);
      
      return () => {
        // Defensive check before unbinding
        if (pusherClient && pusherClient.connection) {
          pusherClient.connection.unbind('connected', handleConnected);
          pusherClient.connection.unbind('connecting', handleConnecting);
          pusherClient.connection.unbind('disconnected', handleDisconnected);
          pusherClient.connection.unbind('failed', handleFailed);
          pusherClient.connection.unbind('unavailable', handleUnavailable);
        }
      };
    } catch (error) {
      console.error('Error in ConnectionStatus component:', error);
      setHasError(true);
    }
  }, []);
  
  // If there's an error with the component, don't render anything
  if (hasError) return null;
  
  // Only show the status in certain conditions
  if (!showStatus) return null;
  
  const statusMessages: Record<ConnectionState, string> = {
    connected: 'Connected to game server',
    connecting: 'Connecting to game server...',
    disconnected: 'Disconnected from game server. Reconnecting...',
    failed: 'Failed to connect to game server. Please refresh.',
    unavailable: 'Game server unavailable. Please try again later.'
  };
  
  const getBadgeVariant = (state: ConnectionState): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (state) {
      case 'connected':
        return 'default';
      case 'connecting':
      case 'disconnected':
        return 'secondary';
      case 'failed':
      case 'unavailable':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Safely render the status component
  try {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 shadow-lg",
          "bg-card text-card-foreground"
        )}>
          <div className={cn(
            "h-2 w-2 rounded-full",
            connectionState === 'connected' ? "bg-green-500" :
            connectionState === 'connecting' ? "bg-yellow-500" :
            "bg-red-500"
          )} />
          <Badge variant={getBadgeVariant(connectionState)}>
            {statusMessages[connectionState]}
          </Badge>
          {connectionState === 'failed' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering ConnectionStatus:', error);
    return null;
  }
} 