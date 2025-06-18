'use client';

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export type FaceDetectionState = {
  isModelLoading: boolean;
  loadingProgress: number;
  isFacePresent: boolean;
  multipleFaces: boolean;
  lookingAway: boolean;
  lookingAwayStartTime: number | null;
  confidenceScore: number;
};

const DETECTION_INTERVAL = 300; // Optimized detection interval
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model/';
const MIN_CONFIDENCE = 0.6; // Increased confidence threshold
const HEAD_OFFSET_THRESHOLD = 0.2; // Threshold for head position deviation

export function useFaceDetection(videoRef: RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<FaceDetectionState>({
    isModelLoading: true,
    loadingProgress: 0,
    isFacePresent: false,
    multipleFaces: false,
    lookingAway: false,
    lookingAwayStartTime: null,
    confidenceScore: 0
  });

  const detectionRef = useRef<number | null>(null);
  const faceapiRef = useRef<typeof import("face-api.js") | null>(null);
  const modelLoadAttempted = useRef(false);

  useEffect(() => {
  
    const loadModels = async () => {
      if (modelLoadAttempted.current) return;
      modelLoadAttempted.current = true;

      try {
        // console.log('Loading face-api models...');
        const faceapi = await import("face-api.js");
        faceapiRef.current = faceapi;

        // Realistic loading progress simulation
        const updateProgress = async (progress: number, delay: number) => {
          await new Promise(resolve => setTimeout(resolve, delay));
          setState(prev => ({ ...prev, loadingProgress: progress }));
        };

        await Promise.all([
          updateProgress(20, 300),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          updateProgress(50, 500),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          updateProgress(80, 500),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        updateProgress(100, 300)

        // console.log('Models loaded successfully');
        setState(prev => ({ ...prev, isModelLoading: false }));
      } catch (error) {
        // console.error("Model loading failed:", error);
        setState(prev => ({ ...prev, isModelLoading: false }));
      }
    };

    loadModels();
    return () => {
      if (detectionRef.current) clearTimeout(detectionRef.current);
    };
  }, []);

  useEffect(() => {
    const getFaceOrientation = (
      landmarks: import("face-api.js").FaceLandmarks68,
      box: import("face-api.js").Box
    ) => {
      const eyesMidpoint = landmarks.positions
        .slice(36, 48) // Eye landmarks
        .reduce((acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }), { x: 0, y: 0 });

      eyesMidpoint.x /= 12;
      eyesMidpoint.y /= 12;

      const faceCenter = {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
      };

      return {
        xOffset: (eyesMidpoint.x - faceCenter.x) / box.width,
        yOffset: (eyesMidpoint.y - faceCenter.y) / box.height
      };
    };

    
    const detectFace = async () => {
      const video = videoRef.current;
      // console.log('Video ReadyState:', video?.readyState, 'Paused:', video?.paused);
      if (!video || !faceapiRef.current || video.readyState < 4) {
        // @ts-expect-error - video.readyState is not yet defined
        detectionRef.current = setTimeout(detectFace, DETECTION_INTERVAL);
        return;
      }

      try {
        // console.log('Starting face detection...');
        const detections = await faceapiRef.current
          .detectAllFaces(video, new faceapiRef.current.SsdMobilenetv1Options({ 
            minConfidence: MIN_CONFIDENCE 
          }))
          .withFaceLandmarks();

        // console.log('Detections:', detections);

        let isLookingAway = detections.length === 0;
        let confidenceScore = 0;
        const now = Date.now();

        if (detections.length > 0) {
          const primaryDetection = detections[0];
          confidenceScore = primaryDetection.detection.score;
          
          if (confidenceScore >= MIN_CONFIDENCE) {
            const orientation = getFaceOrientation(
              primaryDetection.landmarks,
              primaryDetection.detection.box
            );

            isLookingAway = Math.abs(orientation.xOffset) > HEAD_OFFSET_THRESHOLD || 
                            Math.abs(orientation.yOffset) > HEAD_OFFSET_THRESHOLD;
          }
        }

        setState(prev => ({
          isModelLoading: false,
          loadingProgress: 100,
          isFacePresent: detections.length > 0 && confidenceScore >= MIN_CONFIDENCE,
          multipleFaces: detections.length > 1,
          lookingAway: isLookingAway,
          confidenceScore,
          lookingAwayStartTime: isLookingAway 
            ? (prev.lookingAwayStartTime || now)
            : null
        }));
      } catch (error) {
        console.error("Detection error:", error);
      }
      // @ts-expect-error - video.readyState is not yet defined
      detectionRef.current = setTimeout(detectFace, DETECTION_INTERVAL);
    };

    if (!state.isModelLoading) {
      console.log("Manually triggering face detection...");
      detectFace();
    }

    const video = videoRef.current;
    console.log('Video ReadyState:', video?.readyState, 'Paused:', video?.paused);
    if (!video || state.isModelLoading) return;

    const handleVideoPlay = () => {
      if (video.paused || video.ended) return;
      detectFace();
    };

    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('resume', handleVideoPlay); // Handle browser autoplay policies
    
    return () => {
      video.removeEventListener('play', handleVideoPlay);
      video.removeEventListener('resume', handleVideoPlay);
      if (detectionRef.current) clearTimeout(detectionRef.current);
    };
  }, [state.isModelLoading, videoRef]);
  return state;
}
