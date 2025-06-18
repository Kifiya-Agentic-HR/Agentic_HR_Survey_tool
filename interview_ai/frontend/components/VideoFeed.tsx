'use client';

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export function VideoFeed({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const { toast } = useToast();
  const [dragConstraints, setDragConstraints] = useState({
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  });

  useEffect(() => {
    const updateConstraints = () => {
      setDragConstraints({
        top: 0,
        left: 0,
        right: window.innerWidth - 320,
        bottom: window.innerHeight - 240
      });
    };

    window.addEventListener('resize', updateConstraints);
    updateConstraints();
    
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "user", width: 1280, height: 720 } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(error => {
            toast({
              variant: "destructive",
              title: "Camera Error",
              description: "Please enable camera permissions to continue"
            });
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Camera Required",
          description: "Camera access is mandatory for this interview"
        });
      }
    }
    
    if (videoRef.current) setupCamera();
  }, [toast, videoRef]);

  return (
    <motion.div
      drag
      dragConstraints={dragConstraints}
      className="fixed bottom-4 left-4 w-80 h-60 rounded-lg overflow-hidden shadow-lg z-[100] bg-black"
    >
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}