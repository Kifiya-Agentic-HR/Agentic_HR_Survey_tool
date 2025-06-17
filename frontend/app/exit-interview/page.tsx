'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  ArrowLeft, 
  Bot, 
  Users, 
  TrendingUp, 
  Settings,
  Play,
  FileText,
  BarChart3
} from 'lucide-react';

export default function ExitInterviewPage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Exit Interview System</h1>
                  <p className="text-sm text-gray-600">AI-powered conversation platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Exit Interview Platform</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Conduct intelligent exit interviews with our AI-powered chat system. 
              Gather valuable insights and understand employee experiences through natural conversations.
            </p>
          </div>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-8 text-white text-center">
            <div className="space-y-4">
              <Bot className="h-16 w-16 mx-auto opacity-80" />
              <h3 className="text-2xl font-bold">AI Chat System Coming Soon</h3>
              <p className="text-green-100 max-w-2xl mx-auto">
                We&apos;re building an advanced conversational AI that will conduct natural, empathetic exit interviews. 
                The system will analyze responses in real-time and provide actionable insights.
              </p>
              <div className="flex items-center justify-center space-x-2 text-green-100">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span>Development in progress</span>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <CardTitle>Natural Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  AI-powered chat that feels natural and empathetic, encouraging honest feedback from departing employees.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <CardTitle>Real-time Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Instant sentiment analysis and pattern recognition to identify key themes and concerns as they emerge.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <CardTitle>Actionable Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Comprehensive reports and visualizations that help HR teams understand trends and improve retention.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <CardTitle>Employee Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Comfortable, private environment for employees to share their experiences and feedback openly.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <FileText className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <CardTitle>Smart Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Automatic transcription and summarization of conversations with key insights highlighted.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Settings className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <CardTitle>Customizable Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Adaptable conversation flows that can be tailored to your organization&apos;s specific needs and culture.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-6 bg-white rounded-lg p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900">Ready to Transform Your Exit Interviews?</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our early access program to be among the first to experience the future of exit interviews. 
              We&apos;ll notify you as soon as the AI chat system is ready for testing.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Play className="h-5 w-5 mr-2" />
                Join Early Access
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}