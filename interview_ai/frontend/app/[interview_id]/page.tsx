"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInterview } from "@/lib/api";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface StatusConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const statusConfig: Record<string, StatusConfig> = {
  completed: {
    title: "Exit Interview Completed",
    description:
      "Thank you for your time and insights. Your feedback has been received and will help us improve.",
    icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
    color: "bg-green-100",
  },
  expired: {
    title: "Link Expired",
    description:
      "This exit interview link has expired. Please reach out to HR for a new one.",
    icon: <Clock className="h-12 w-12 text-orange-600" />,
    color: "bg-orange-100",
  },
  scheduled: {
    title: "Begin Your Exit Interview",
    description: "",
    icon: null,
    color: "",
  },
};

export default function Home() {
  const params = useParams();
  const router = useRouter();
  const interviewId = (params?.interview_id as string) ?? "";
  const [loading, setLoading] = useState(true);
  const [interviewStatus, setInterviewStatus] = useState<
    "scheduled" | "completed" | "expired"
  >("scheduled");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkInterviewStatus = async () => {
      try {
        const response = await getInterview(interviewId);
        if (!response.success) throw new Error(response.error);
        setInterviewStatus(response.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch interview status");
      } finally {
        setLoading(false);
      }
    };

    checkInterviewStatus();
  }, [interviewId]);

  const handleStart = () => {
    router.push(`/interview/${interviewId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="h-12 w-12 border-4 border-[#364957] border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Checking interview status...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="h-20 mb-8 mx-auto flex items-center justify-center">
            <AlertCircle className="h-16 w-16 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Error Loading Interview</h1>
          <p className="text-muted-foreground">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (interviewStatus !== "scheduled") {
    const config = statusConfig[interviewStatus];

    if (!config) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-red-600">Unsupported interview status: {interviewStatus}</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <img
            src="https://kifiya.com/wp-content/uploads/2022/12/Logo.svg"
            alt="Kifiya Logo"
            className="h-20 mb-8 mx-auto"
          />
          <h1 className="text-4xl font-bold mb-2">Kifiya Exit-Interview Platform</h1>
        </motion.div>

        <Card className="w-full max-w-2xl">
          <CardHeader>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-semibold text-center"
            >
              {config.title}
            </motion.h2>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center space-y-6"
            >
              <motion.div
                variants={item}
                className={`h-24 w-24 rounded-full ${config.color} flex items-center justify-center mb-4`}
              >
                {config.icon}
              </motion.div>
              <motion.p
                variants={item}
                className="text-muted-foreground text-center"
              >
                {config.description}
              </motion.p>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <img
          src="https://kifiya.com/wp-content/uploads/2022/12/Logo.svg"
          alt="Kifiya Logo"
          className="h-20 mb-8 mx-auto"
        />
        <h1 className="text-4xl font-bold mb-2">Kifiya Exit-Interview Platform</h1>
        <p className="text-muted-foreground">
          We'd love to hear your thoughts and experiences as you transition out of the company.
          Your feedback helps us grow.
        </p>
      </motion.div>

      <Card className="w-full max-w-3xl">
        <CardHeader>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-semibold text-center"
          >
            Start the Exit Interview
          </motion.h2>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              className="w-full bg-[#364957] hover:bg-[#364957]/90 text-white text-lg py-6"
              size="lg"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? (
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <span>Preparing Interview...</span>
                </motion.div>
              ) : (
                "Begin Interview"
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
