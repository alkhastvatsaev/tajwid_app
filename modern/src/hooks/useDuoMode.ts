"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection, MediaConnection } from 'peerjs';

export interface DuoState {
  peerId: string | null;
  remotePeerId: string | null;
  isConnected: boolean;
  role: 'user1' | 'user2' | null;
  remoteStream: MediaStream | null;
}

export const useDuoMode = () => {
  const [state, setState] = useState<DuoState>({
    peerId: null,
    remotePeerId: null,
    isConnected: false,
    role: null,
    remoteStream: null
  });

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const callRef = useRef<MediaConnection | null>(null);

  const initPeer = useCallback((role: 'user1' | 'user2') => {
    const peerId = `tajwid-vatsaev-${role}`;
    const targetId = `tajwid-vatsaev-${role === 'user1' ? 'user2' : 'user1'}`;

    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on('open', (id) => {
      setState(prev => ({ ...prev, peerId: id, role }));
      
      // Try to connect to the other peer after a short delay
      setTimeout(() => {
        connectToPeer(targetId);
      }, 2000);
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setupConnection(conn);
    });

    peer.on('call', async (call) => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      call.answer(stream);
      call.on('stream', (remoteStream) => {
        setState(prev => ({ ...prev, remoteStream }));
      });
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'peer-unavailable') {
        // Expected if other user isn't online yet
      }
    });

    return () => {
      peer.destroy();
    };
  }, []);

  const connectToPeer = useCallback(async (targetId: string) => {
    if (!peerRef.current) return;

    // Data connection
    const conn = peerRef.current.connect(targetId);
    connRef.current = conn;
    setupConnection(conn);

    // Audio call
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const call = peerRef.current.call(targetId, stream);
      call.on('stream', (remoteStream) => {
        setState(prev => ({ ...prev, remoteStream }));
      });
    } catch (err) {
      console.error('Mic access error during call:', err);
    }
  }, []);

  const setupConnection = (conn: DataConnection) => {
    conn.on('open', () => {
      setState(prev => ({ ...prev, isConnected: true, remotePeerId: conn.peer }));
    });

    conn.on('data', (data: any) => {
      // Handle remote events (like word validation)
      console.log('Received data:', data);
    });

    conn.on('close', () => {
      setState(prev => ({ ...prev, isConnected: false, remotePeerId: null }));
    });
  };

  const sendData = (data: any) => {
    if (connRef.current && state.isConnected) {
      connRef.current.send(data);
    }
  };

  return { state, initPeer, sendData };
};
