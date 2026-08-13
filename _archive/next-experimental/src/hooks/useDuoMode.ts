"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Peer, { DataConnection, MediaConnection } from "peerjs";

export interface DuoState {
  peerId: string | null;
  roomCode: string | null;
  remotePeerId: string | null;
  isConnected: boolean;
  role: "host" | "guest" | null;
  remoteStream: MediaStream | null;
  status: "idle" | "connecting" | "waiting" | "connected" | "error";
  error: string | null;
}

const ROOM_PREFIX = "tajwid-room-";

function randomRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function peerIdForRoom(roomCode: string, role: "host" | "guest") {
  return `${ROOM_PREFIX}${roomCode.toUpperCase()}-${role}`;
}

export const useDuoMode = () => {
  const [state, setState] = useState<DuoState>({
    peerId: null,
    roomCode: null,
    remotePeerId: null,
    isConnected: false,
    role: null,
    remoteStream: null,
    status: "idle",
    error: null,
  });

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const destroy = useCallback(() => {
    try {
      callRef.current?.close();
    } catch {
      /* ignore */
    }
    try {
      connRef.current?.close();
    } catch {
      /* ignore */
    }
    try {
      peerRef.current?.destroy();
    } catch {
      /* ignore */
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerRef.current = null;
    connRef.current = null;
    callRef.current = null;
  }, []);

  const disconnect = useCallback(() => {
    destroy();
    setState({
      peerId: null,
      roomCode: null,
      remotePeerId: null,
      isConnected: false,
      role: null,
      remoteStream: null,
      status: "idle",
      error: null,
    });
  }, [destroy]);

  useEffect(() => {
    return () => {
      destroy();
    };
  }, [destroy]);

  const setupConnection = useCallback((conn: DataConnection) => {
    conn.on("open", () => {
      setState((prev) => ({
        ...prev,
        isConnected: true,
        remotePeerId: conn.peer,
        status: "connected",
      }));
    });
    conn.on("data", (data) => {
      console.log("Duo data:", data);
    });
    conn.on("close", () => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        remotePeerId: null,
        status: "waiting",
      }));
    });
  }, []);

  const getMic = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    return stream;
  }, []);

  const connectToPeer = useCallback(
    async (targetId: string) => {
      if (!peerRef.current) return;
      const conn = peerRef.current.connect(targetId);
      connRef.current = conn;
      setupConnection(conn);

      try {
        const stream = await getMic();
        const call = peerRef.current.call(targetId, stream);
        callRef.current = call;
        call.on("stream", (remoteStream) => {
          setState((prev) => ({
            ...prev,
            remoteStream,
            isConnected: true,
            status: "connected",
          }));
        });
      } catch (err) {
        console.error("Mic access error during call:", err);
      }
    },
    [getMic, setupConnection],
  );

  const createRoom = useCallback(async () => {
    destroy();
    const roomCode = randomRoomCode();
    const peerId = peerIdForRoom(roomCode, "host");
    setState((prev) => ({
      ...prev,
      roomCode,
      role: "host",
      status: "connecting",
      error: null,
    }));

    const peer = new Peer(peerId);
    peerRef.current = peer;

    peer.on("open", (id) => {
      setState((prev) => ({
        ...prev,
        peerId: id,
        roomCode,
        role: "host",
        status: "waiting",
      }));
    });

    peer.on("connection", (conn) => {
      connRef.current = conn;
      setupConnection(conn);
    });

    peer.on("call", async (call) => {
      try {
        const stream = await getMic();
        call.answer(stream);
        callRef.current = call;
        call.on("stream", (remoteStream) => {
          setState((prev) => ({
            ...prev,
            remoteStream,
            isConnected: true,
            status: "connected",
          }));
        });
      } catch (err) {
        console.error(err);
      }
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err.message || String(err.type),
      }));
    });

    return roomCode;
  }, [destroy, getMic, setupConnection]);

  const joinRoom = useCallback(
    async (roomCodeRaw: string) => {
      const roomCode = roomCodeRaw.trim().toUpperCase();
      if (!/^[A-Z0-9]{4,8}$/.test(roomCode)) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "Code invalide",
        }));
        return;
      }

      destroy();
      const peerId = peerIdForRoom(roomCode, "guest");
      const hostId = peerIdForRoom(roomCode, "host");

      setState((prev) => ({
        ...prev,
        roomCode,
        role: "guest",
        status: "connecting",
        error: null,
      }));

      const peer = new Peer(peerId);
      peerRef.current = peer;

      peer.on("open", (id) => {
        setState((prev) => ({
          ...prev,
          peerId: id,
          roomCode,
          role: "guest",
          status: "connecting",
        }));
        void connectToPeer(hostId);
      });

      peer.on("connection", (conn) => {
        connRef.current = conn;
        setupConnection(conn);
      });

      peer.on("call", async (call) => {
        try {
          const stream = await getMic();
          call.answer(stream);
          callRef.current = call;
          call.on("stream", (remoteStream) => {
            setState((prev) => ({
              ...prev,
              remoteStream,
              isConnected: true,
              status: "connected",
            }));
          });
        } catch (err) {
          console.error(err);
        }
      });

      peer.on("error", (err) => {
        console.error("Peer error:", err);
        if (err.type === "peer-unavailable") {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: "Salle introuvable — vérifiez le code",
          }));
        } else {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: err.message || String(err.type),
          }));
        }
      });
    },
    [connectToPeer, destroy, getMic, setupConnection],
  );

  const sendData = useCallback((data: unknown) => {
    if (connRef.current?.open) {
      connRef.current.send(data);
    }
  }, []);

  return {
    state,
    createRoom,
    joinRoom,
    disconnect,
    sendData,
  };
};
