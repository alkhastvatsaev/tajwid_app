"use client";

import { useState, useCallback, useRef } from "react";
import axios from "axios";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db, auth } from "@/lib/firebase";

export const useWhisperRecognition = (
  onTranscript: (transcript: string) => void,
) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Noise Reduction Preprocessing (Basic High Pass & Dynamics Compressor)
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);

      const highPass = audioContext.createBiquadFilter();
      highPass.type = "highpass";
      highPass.frequency.value = 100; // Filter out low rumbles

      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
      compressor.knee.setValueAtTime(40, audioContext.currentTime);
      compressor.ratio.setValueAtTime(12, audioContext.currentTime);
      compressor.attack.setValueAtTime(0, audioContext.currentTime);
      compressor.release.setValueAtTime(0.25, audioContext.currentTime);

      const destination = audioContext.createMediaStreamDestination();
      source.connect(highPass).connect(compressor).connect(destination);

      const mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        // 1. Upload to Firebase Storage for Training/Security
        const filename = `recordings/${auth.currentUser?.uid || "anon"}/${Date.now()}.webm`;
        const storageRef = ref(storage, filename);

        let audioUrl = "";
        try {
          const snapshot = await uploadBytes(storageRef, audioBlob);
          audioUrl = await getDownloadURL(snapshot.ref);
        } catch (err) {
          console.error("Storage upload failed:", err);
        }

        const formData = new FormData();
        formData.append("file", audioBlob, "speech.webm");

        try {
          // 2. Transcribe via Whisper
          const response = await axios.post("/api/whisper", formData);
          const transcript = response.data.transcript;

          if (transcript) {
            onTranscript(transcript);

            // 3. Log data for Continuous Learning (Feedback Loop)
            // This collection will be used to fine-tune future models
            if (auth.currentUser) {
              await addDoc(collection(db, "training_data"), {
                userId: auth.currentUser.uid,
                audioUrl,
                transcript,
                timestamp: serverTimestamp(),
                envInfo: "noise-filtered-v1",
              });
            }
          }
        } catch (error) {
          console.error("Whisper error:", error);
        } finally {
          setIsProcessing(false);
          audioContext.close();
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting media recorder:", error);
    }
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsListening(false);
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return { isListening, isProcessing, toggleListening };
};
