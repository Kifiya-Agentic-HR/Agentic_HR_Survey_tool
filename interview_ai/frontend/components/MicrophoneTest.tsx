'use client';

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicrophoneTestProps {
  onReady: (ready: boolean) => void;
}

export function MicrophoneTest({ onReady }: MicrophoneTestProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContext.current = new AudioContext();
      analyser.current = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      
      analyser.current.fftSize = 32;
      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
      
      setIsRecording(true);
      onReady(true);
      
      const updateVolume = () => {
        if (!analyser.current || !dataArray.current) return;
        
        analyser.current.getByteFrequencyData(dataArray.current);
        const average = dataArray.current.reduce((a, b) => a + b) / dataArray.current.length;
        setVolume(Math.min(average / 128, 1));
        
        animationFrame.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (err) {
      setError("Failed to access microphone. Please check permissions.");
      onReady(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <Mic className={`h-5 w-5 ${isRecording ? 'text-[#FF8A00]' : 'text-[#364957]'}`} />
        <span className="font-medium">Microphone</span>
      </div>

      <div className="flex items-center gap-3">
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 100 }}
              exit={{ width: 0 }}
              className="h-2 bg-gray-200 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-[#FF8A00]"
                animate={{ width: `${volume * 100}%` }}
                transition={{ type: "spring", bounce: 0 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!isRecording ? (
          <Button
            variant="outline"
            onClick={startRecording}
            size="sm"
            className="text-[#FF8A00] hover:text-[#FF8A00] hover:bg-[#FF8A00]/10"
          >
            Test Microphone
          </Button>
        ) : (
          <span className="text-emerald-500 text-sm font-medium flex items-center gap-1">
            ✅ Ready
          </span>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}