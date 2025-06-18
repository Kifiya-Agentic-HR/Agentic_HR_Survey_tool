// components/Completion.tsx
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { clearSessionId } from "@/lib/api";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CompletionProps {
  completed: boolean;
  violations: never[]; // unused now
  interviewId: string;
}

const MotionCard = motion(Card);

export default function Completion({ completed, interviewId }: CompletionProps) {
  const router = useRouter();

  useEffect(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  const handleFinish = () => {
    clearSessionId();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <MotionCard
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background to-muted/10" />

        <CardHeader className="text-center space-y-4 relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 250, damping: 20 }}
          >
            <img
              src="https://kifiya.com/wp-content/uploads/2022/12/Logo.svg"
              alt="Kifiya Logo"
              className="h-12 mb-6 mx-auto"
              aria-hidden="true"
            />
          </motion.div>

          <motion.div
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            className="flex justify-center"
          >
            <CheckCircle2
              className={cn("h-20 w-20 mx-auto mb-4 text-green-500")}
              aria-label="Success"
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold mb-2"
          >
            Interview Completed
          </motion.h2>
          <p className="text-muted-foreground">Thank you for participating in the interview</p>
        </CardHeader>

        <CardContent className="relative z-10">
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={handleFinish}
              className="px-8 py-6 text-lg rounded-full transition-transform hover:scale-105"
              variant="default"
            >
              Session Completed
            </Button>
          </div>
        </CardContent>
      </MotionCard>
    </div>
  );
}
