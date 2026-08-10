"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{ 0: { transcript: string } }>;
};

export const useSpeechRecognition = (
  onTranscript: (transcript: string) => void,
) => {
  const [isListening, setIsListening] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const listeningRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stopVolumeTrack = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setVolume(0);
  }, []);

  const cleanupMic = useCallback(() => {
    stopVolumeTrack();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, [stopVolumeTrack]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setIsListening(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    stopVolumeTrack();
  }, [stopVolumeTrack]);

  const startListening = useCallback(async () => {
    setError(null);

    if (
      typeof window !== "undefined" &&
      window.location.protocol === "http:" &&
      !["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      setError("Le microphone nécessite HTTPS ou localhost.");
      return;
    }

    const SpeechRecognitionCtor =
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognitionLike;
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => SpeechRecognitionLike;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setError(
        "Reconnaissance vocale non supportée. Utilisez Chrome ou Safari.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioContextCtor();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "ar-SA";
      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        onTranscriptRef.current(transcript.trim());
      };
      recognition.onerror = (event) => {
        if (event.error === "not-allowed") {
          setError("Microphone bloqué par le navigateur.");
        }
        if (event.error !== "aborted" && event.error !== "no-speech") {
          console.error("Speech recognition error", event.error);
        }
      };
      recognition.onend = () => {
        if (listeningRef.current) {
          try {
            recognition.start();
          } catch {
            /* ignore */
          }
        }
      };

      recognitionRef.current = recognition;
      listeningRef.current = true;
      setIsListening(true);
      recognition.start();

      const tick = () => {
        const node = analyserRef.current;
        if (!node || !listeningRef.current) return;
        const data = new Uint8Array(node.frequencyBinCount);
        node.getByteFrequencyData(data);
        let sum = 0;
        for (const v of data) sum += v;
        setVolume(sum / data.length);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") {
        setError("Accès micro refusé.");
      } else if (name === "NotFoundError") {
        setError("Aucun microphone détecté.");
      } else {
        setError(err instanceof Error ? err.message : "Erreur micro");
      }
      cleanupMic();
    }
  }, [cleanupMic]);

  const toggleListening = useCallback(() => {
    if (listeningRef.current) {
      stopListening();
      cleanupMic();
    } else {
      void startListening();
    }
  }, [cleanupMic, startListening, stopListening]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      cleanupMic();
    };
  }, [cleanupMic]);

  return {
    isListening,
    toggleListening,
    startListening,
    stopListening,
    volume,
    error,
  };
};
