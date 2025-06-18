'use client';

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Camera, AlertCircle, Mic, CheckCircle, Loader2 } from "lucide-react";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { VideoComponent } from "@/components/VideoComponent"
import { MicrophoneTest } from "@/components/MicrophoneTest";

const PRIMARY_COLOR = "#364957";
const SECONDARY_COLOR = "#FF8A00";

interface PreInterviewCheckProps {
  onComplete: () => void;
}

export function PreInterviewCheck({ onComplete }: PreInterviewCheckProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [checks, setChecks] = useState({
    camera: false,
    microphone: false,
    consent: false
  });
  const [fallbackMode, setFallbackMode] = useState(false);

  const {
    isModelLoading,
    loadingProgress,
    isFacePresent,
    multipleFaces,
    lookingAway,
    confidenceScore
  } = useFaceDetection(videoRef);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isModelLoading) {
        setFallbackMode(true);
        toast({
          title: "Face Detection Issues",
          description: "Continuing with basic camera check. Some anti-cheating features may be limited.",
          variant: "default",
          
        });
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isModelLoading, toast]);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setChecks(prev => ({ ...prev, camera: true }));
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Camera Error",
          description: "Please enable camera access in your browser settings to continue."
        });
      }
    }
    setupCamera();
  }, [toast]);

  const getFaceDetectionStatus = () => {
    if (!checks.camera) return { text: "Camera not detected", color: "text-red-500", icon: <AlertCircle className="h-5 w-5" /> };
    if (fallbackMode) return { text: "Basic camera check passed", color: "text-emerald-500", icon: <CheckCircle className="h-5 w-5" /> };
    if (isModelLoading) return { text: "Loading detection model...", color: "text-amber-500", icon: <Loader2 className="h-5 w-5 animate-spin" /> };
    if (!isFacePresent) return { text: "No face detected", color: "text-red-500", icon: <AlertCircle className="h-5 w-5" /> };
    if (multipleFaces) return { text: "Multiple faces detected", color: "text-red-500", icon: <AlertCircle className="h-5 w-5" /> };
    if (confidenceScore < 0.6) return { text: "Poor lighting conditions", color: "text-amber-500", icon: <AlertCircle className="h-5 w-5" /> };
    if (lookingAway) return { text: "Face not centered", color: "text-amber-500", icon: <AlertCircle className="h-5 w-5" /> };
    return { text: "Face detected", color: "text-emerald-500", icon: <CheckCircle className="h-5 w-5" /> };
  };

  const isComplete = checks.camera && checks.microphone && checks.consent;
  const faceStatus = getFaceDetectionStatus();

  const handleComplete = () => onComplete();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-4 bg-gradient-to-b from-[#364957]/5 to-white"
    >
      <Card className="w-full max-w-xl mx-auto shadow-2xl border-[#364957]/20">
        <CardHeader className="space-y-3 bg-[#364957] text-white rounded-t-lg pb-6 border-b-4 border-[#FF8A00]">
          <div className="flex items-center justify-between">
            <Image
              src="https://kifiya.com/wp-content/uploads/2022/12/Logo.svg"
              alt="Kifiya Logo"
              width={120}
              height={32}
              className="brightness-0 invert"
              priority
            />
            <div className="px-3 py-1 bg-[#FF8A00] rounded-full text-xs font-medium uppercase tracking-wide">
              System Check
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Interview Preparation</h2>
            <p className="text-sm text-gray-200 opacity-90">
              Complete these checks to ensure optimal interview conditions
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-6">
          <motion.div 
            className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video shadow-lg border-2 border-[#364957]/20"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <VideoComponent ref={videoRef} />
            <AnimatePresence>
              {isModelLoading && !fallbackMode && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                  <div className="text-center text-white p-6 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#FF8A00]" />
                    <p className="font-medium">Initializing AI Proctoring</p>
                    <Progress 
                      value={loadingProgress} 
                      className="w-56 h-2 bg-white/20"
                      // indicatorClassName="bg-[#FF8A00]"
                    />
                    <span className="text-sm opacity-75">{loadingProgress}% loaded</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="space-y-6">
            <motion.div 
              className="p-4 bg-white rounded-xl border border-[#364957]/20 shadow-sm"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#364957]/10 rounded-lg">
                    <Camera className="h-6 w-6 text-[#364957]" />
                  </div>
                  <span className="font-semibold text-[#364957]">Camera Check</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                  faceStatus.color === 'text-emerald-500' ? 'bg-emerald-50' : 
                  faceStatus.color === 'text-amber-500' ? 'bg-amber-50' : 'bg-red-50'
                }`}>
                  {faceStatus.icon}
                  <span className={`font-medium ${faceStatus.color}`}>{faceStatus.text}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="p-4 bg-white rounded-xl border border-[#364957]/20 shadow-sm"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#364957]/10 rounded-lg">
                  <Mic className="h-6 w-6 text-[#364957]" />
                </div>
                <span className="font-semibold text-[#364957]">Microphone Check</span>
              </div>
              <MicrophoneTest 
                onReady={(ready) => setChecks(prev => ({ ...prev, microphone: ready }))}
              />
            </motion.div>

            <motion.div 
              className="p-4 bg-white rounded-xl border border-[#364957]/20 shadow-sm"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={checks.consent}
                  onCheckedChange={(checked) =>
                    setChecks(prev => ({ ...prev, consent: checked === true }))
                  }
                  className="mt-0.5 data-[state=checked]:bg-[#364957] data-[state=checked]:border-[#364957]"
                />
                <label
                  htmlFor="consent"
                  className="text-sm leading-relaxed text-[#364957]/90"
                >
                  I consent to video/audio recording and behavioral analysis during this interview
                </label>
              </div>
            </motion.div>

            {!isComplete && checks.camera && checks.microphone && checks.consent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#FF8A00]/10 rounded-xl p-4 text-[#364957] text-sm flex items-start gap-3 border border-[#FF8A00]/30"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#FF8A00]" />
                <div className="space-y-2">
                  <p className="font-medium text-[#364957]">Optimization Checklist</p>
                  <ul className="space-y-1.5">
                    {['Well-lit environment', 'Face centered in frame', 'Quiet private space', 'Stable internet connection'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#FF8A00]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <motion.div 
            className="w-full"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              className="w-full bg-[#364957] hover:bg-[#364957]/90 text-white h-12 text-base font-medium rounded-xl shadow-lg transition-all"
              onClick={handleComplete}
              disabled={!isComplete}
            >
              {isModelLoading && !fallbackMode ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-[#FF8A00]" />
                  <span>Initializing Security ({loadingProgress}%)</span>
                </div>
              ) : (
                "Start Interview"
              )}
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}