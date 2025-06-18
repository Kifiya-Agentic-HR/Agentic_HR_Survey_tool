'use client';

import { forwardRef } from "react";
import dynamic from "next/dynamic";

export const VideoComponent = forwardRef<HTMLVideoElement>(
  (props, ref) => (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover"
      {...props}
    />
  )
);
VideoComponent.displayName = "VideoComponent";