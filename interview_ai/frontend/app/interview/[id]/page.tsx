"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { createSession, clearSessionId } from "@/lib/api";
import type { ChatMessage } from "@/lib/schema";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

const Completion = dynamic(() => import("@/pages/completion"), {
  ssr: false,
});

export default function Interview() {
  const params = useParams();
  const interviewId = params?.id as string;
  const { toast } = useToast();
  const router = useRouter();

  if (!interviewId) {
    router.push("/");
    return null;
  }

  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const sessionResponse = await createSession(interviewId);
        if (!sessionResponse.success) {
          throw new Error(sessionResponse.error);
        }
        if (sessionResponse.success && sessionResponse.sessionId) {
          setSessionId(sessionResponse.sessionId);
          setChatHistory(sessionResponse.chatHistory);
        }
      } catch (error) {
        console.error("Session initialization failed:", error);
        window.location.href = `/${interviewId}`;
      }
    };

    initializeSession();
  }, [interviewId]);

  if (isInterviewComplete) {
    clearSessionId();
    return (
      <Completion
        violations={[]}
        completed={true}
        interviewId={interviewId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 h-screen">
        <div className="h-full">
          {sessionId && (
            <ChatInterface
              sessionId={sessionId}
              initialMessages={chatHistory}
              onComplete={() => {
                setIsInterviewComplete(true);
                setIsInterviewStarted(false);
              }}
              onStart={() => setIsInterviewStarted(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
