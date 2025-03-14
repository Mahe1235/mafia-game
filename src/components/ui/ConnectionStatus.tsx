'use client';

import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher';

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
  
  const statusColors: Record<ConnectionState, string> = {
    connected: 'bg-green-100 text-green-800 border-green-300',
    connecting: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    disconnected: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    failed: 'bg-red-100 text-red-800 border-red-300',
    unavailable: 'bg-red-100 text-red-800 border-red-300'
  };
  
  // Safely render the status component
  try {
    return (
      <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 p-3 rounded-md 
                      shadow-md border ${statusColors[connectionState]} z-50 
                      flex items-center space-x-2 text-sm animate-fade-in`}>
        <div className={`w-2 h-2 rounded-full ${
          connectionState === 'connected' ? 'bg-green-500' :
          connectionState === 'connecting' ? 'bg-yellow-500' :
          'bg-red-500'
        }`} />
        <span>{statusMessages[connectionState]}</span>
        {connectionState === 'failed' && (
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 px-2 py-1 bg-red-200 hover:bg-red-300 rounded-md text-xs font-medium"
          >
            Refresh
          </button>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error rendering ConnectionStatus:', error);
    return null;
  }
} 