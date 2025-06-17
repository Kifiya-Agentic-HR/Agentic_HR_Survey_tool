'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  MessageSquare, 
  LogOut, 
  User, 
  Settings,
  ChevronRight,
  TrendingUp,
  RefreshCcw,
  Users,
  FileText,
  BarChart,
  Search
} from 'lucide-react';
import { authService, User as UserType } from '@/lib/auth';

export default function DashboardPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();
 
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    
    const userData = authService.getUser();
    if (userData) {
      setUser(userData);
    }
  }, [router]);

  const handleLogout = () => {
    authService.logout();
    router.push('/auth/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AHRS Platform</h1>
                <p className="text-sm text-gray-600">Analytics & Insights Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.first_name} {user.last_name}</span>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          

          {/* Main Navigation Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Survey Analysis Dashboard */}
            <Link href="/survey-dashboard">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 h-full">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl text-gray-900 group-hover:text-blue-600 transition-colors">
                    Survey Analysis Dashboard
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Comprehensive survey data analysis with advanced visualizations and insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-blue-600">
                        <TrendingUp className="h-6 w-6 mx-auto mb-1" />
                        Analytics
                      </div>
                      <p className="text-sm text-gray-600">Multiple choice analysis</p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-600">
                        <FileText className="h-6 w-6 mx-auto mb-1" />
                        Text Analysis
                      </div>
                      <p className="text-sm text-gray-600">NLP & sentiment analysis</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <ChevronRight className="h-4 w-4 mr-2 text-blue-500" />
                      Interactive charts and visualizations
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ChevronRight className="h-4 w-4 mr-2 text-blue-500" />
                      Cross-tabulation analysis
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ChevronRight className="h-4 w-4 mr-2 text-blue-500" />
                      Export and reporting tools
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Get started with survey analysis</span>
                      <ChevronRight className="h-4 w-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Exit Interview System */}
            <Link href="/exit-interview">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-green-500 h-full">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <MessageSquare className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl text-gray-900 group-hover:text-green-600 transition-colors">
                    Exit Interview System
                  </CardTitle>
                  <CardDescription className="text-lg">
                    AI-powered exit interview platform with intelligent chat system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-green-600">
                        <Users className="h-6 w-6 mx-auto mb-1" />
                        AI Chat
                      </div>
                      <p className="text-sm text-gray-600">Intelligent conversations</p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-purple-600">
                        <Search className="h-6 w-6 mx-auto mb-1" />
                        Insights
                      </div>
                      <p className="text-sm text-gray-600">Deep analysis & patterns</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <ChevronRight className="h-4 w-4 mr-2 text-green-500" />
                      Natural language processing
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ChevronRight className="h-4 w-4 mr-2 text-green-500" />
                      Automated sentiment analysis
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ChevronRight className="h-4 w-4 mr-2 text-green-500" />
                      Real-time conversation insights
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Start intelligent interviews</span>
                      <ChevronRight className="h-4 w-4 text-green-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Features Overview */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <RefreshCcw className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <CardTitle>Turn Feedback into Action.</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Identify key issues and implement data-driven improvements with real-time insights from employee feedback.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <CardTitle>See What Drives Engagement at Every Level.</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Discover the top motivators and blockers across teams, departments, and roles to build a more engaged workforce.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <CardTitle>Get clear, visual insights into morale, satisfaction, and workplace culture</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Explore intuitive charts and dashboards that reveal how your team feels and how your culture is evolving over time.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}