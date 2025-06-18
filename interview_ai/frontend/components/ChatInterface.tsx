"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendChatMessage, ChatResponse } from "@/lib/api";
import type { ChatMessage } from "@/lib/schema";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, AlertCircle, Bot, User } from "lucide-react";

const PRIMARY_COLOR = "#364957";
const SECONDARY_COLOR = "#FF8A00";

interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: ChatMessage[];
  onComplete?: () => void;
  onStart?: () => void;
}

export function ChatInterface({
  sessionId,
  initialMessages = [],
  onComplete,
  onStart,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function fetchInitialPrompt(): Promise<void> {
    setErrorMessage(null);
    setIsSending(true);
    try {
      const response: ChatResponse = await sendChatMessage(sessionId, "");
      setIsSending(false);

      if (response?.success) {
        const interviewerMsg: ChatMessage = {
          text: response.text,
          role: "interviewer",
        };
        setMessages((prev) => [...prev, interviewerMsg]);
        onStart?.();

        if (response.state === "completed") {
          onComplete?.();
        }
      } else {
        throw new Error("Server responded with an error");
      }
    } catch (error: unknown) {
      setIsSending(false);
      const err = (error as Error)?.message || "Unknown error occurred.";
      setErrorMessage(`Error initializing chat: ${err}`);
      console.error("Error initializing chat:", error);
      // Retry after 3 seconds
      setTimeout(fetchInitialPrompt, 3000);
    }
  }

  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    } else {
      fetchInitialPrompt();
      console.log("Fetching initial prompt");
    }
  }, [initialMessages]);

  async function handleSend(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!message.trim()) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      text: message.trim(),
      role: "user",
    };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setIsSending(true);

    try {
      const response: ChatResponse = await sendChatMessage(sessionId, userMsg.text);
      setIsSending(false);

      if (response?.success) {
        const interviewerMsg: ChatMessage = {
          text: response.text,
          role: "interviewer",
        };
        setMessages((prev) => [...prev, interviewerMsg]);

        if (response.state === "completed") {
          onComplete?.();
        } else {
          onStart?.();
        }
      } else {
        throw new Error("An unknown server error occurred");
      }
    } catch (error: unknown) {
      setIsSending(false);
      const err = (error as Error)?.message || "Unknown error occurred.";
      setErrorMessage(`Error sending message: ${err}`);
      console.error("Error sending message:", error);
    }
  }

  return (
    <Card className="flex flex-col h-full w-full max-w-3xl mx-auto shadow-xl rounded-xl overflow-hidden border border-[#364957]/20">
      {/* Header with brand styling */}
      <div className="bg-[#364957] p-6 flex items-center justify-center space-x-4 border-b border-[#FF8A00]/30">
        <img
          src="https://kifiya.com/wp-content/uploads/2022/12/Logo.svg"
          alt="Kifiya Logo"
          className="h-8 brightness-0 invert"
        />
        <div className="h-8 w-px bg-[#FF8A00]/30" />
        <div className="flex items-center space-x-3">
          <Bot className="h-6 w-6 text-[#FF8A00]" />
          <h1 className="text-xl font-semibold text-white">AI Interview Assistant</h1>
        </div>
      </div>

      {/* Error message with brand colors */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            className="bg-[#FF8A00]/10 border-y border-[#FF8A00]/30"
          >
            <div className="max-w-3xl mx-auto px-6 py-3 flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-[#FF8A00]" />
              <span className="text-sm text-[#364957]">{errorMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area with enhanced styling */}
      <ScrollArea className="flex-1 bg-gradient-to-b from-white to-[#364957]/05">
        <div className="px-6 py-8 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-4 max-w-[85%] rounded-2xl flex items-start gap-3 ${
                    msg.role === "user"
                      ? "bg-[#364957] text-white"
                      : "bg-white border border-[#364957]/20"
                  }`}
                >
                  <div className="mt-1">
                    {msg.role === "user" ? (
                      <User className="h-5 w-5 text-[#FF8A00]" />
                    ) : (
                      <Bot className="h-5 w-5 text-[#364957]" />
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                </div>
              </motion.div>
            ))}

            {isSending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-start space-x-3"
              >
                <div className="p-4 max-w-[85%] rounded-2xl bg-white border border-[#364957]/20">
                  <div className="flex items-center space-x-2 text-[#364957]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Analyzing response...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Input area with brand styling */}
      <form onSubmit={handleSend} className="p-6 bg-white border-t border-[#364957]/10">
        <div className="flex gap-3">
          <Input
            placeholder="Type your response here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSending}
            className="flex-1 rounded-xl border-[#364957]/20 focus:border-[#FF8A00] focus:ring-[#FF8A00] placeholder:text-[#364957]/60"
          />
          <Button
            type="submit"
            disabled={isSending}
            className="rounded-xl bg-[#FF8A00] hover:bg-[#FF8A00]/90 text-white px-6 font-medium shadow-sm transition-colors"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}