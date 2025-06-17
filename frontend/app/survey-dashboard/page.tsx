'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, BarChart3, FileText, TrendingUp, Database,ArrowLeft, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import FileUpload from '@/components/FileUpload';
import MultipleChoiceAnalysis from '@/components/MultipleChoiceAnalysis';
import TextAnalysis from '@/components/TextAnalysis';
import LLMAnalysis from '@/components/LLMAnalysis';
import SummaryDashboard from '@/components/SummaryDashboard';
import CrossTabulation from '@/components/CrossTabulation';
import Link from 'next/link';

interface DatasetInfo {
  filename: string;
  total_responses: number;
  total_questions: number;
  multiple_choice_questions: number;
  text_questions: number;
  mc_column_names: string[];
  text_column_names: string[];
  upload_success: boolean;
}

export default function SurveyDashboardPage() {
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [router]);

  const handleUploadSuccess = (info: DatasetInfo) => {
    setDatasetInfo(info);
    setActiveTab('summary');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
                <div className="bg-blue-600 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Agentic HR Engagment Survey Analysis Dashboard</h1>
                  <p className="text-sm text-gray-600">Advanced analytics for survey data</p>
                </div>
              </div>
            </div>
            {datasetInfo && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{datasetInfo.filename}</p>
                  <p className="text-xs text-gray-500">
                    {datasetInfo.total_responses} responses • {datasetInfo.total_questions} questions
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-6 bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload Data</span>
            </TabsTrigger>
            <TabsTrigger value="summary" disabled={!datasetInfo} className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
            <TabsTrigger value="multiple-choice" disabled={!datasetInfo} className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Multiple Choice</span>
            </TabsTrigger>
            <TabsTrigger value="text-analysis" disabled={!datasetInfo} className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Text Analysis</span>
            </TabsTrigger>
             <TabsTrigger value="llm-analysis" disabled={!datasetInfo} className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>AI Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="cross-tab" disabled={!datasetInfo} className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Cross Analysis</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="upload" className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-gray-900">Upload Your Survey Data</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Upload your engagment survey dataset to begin analysis. We support CSV and Excel files with multiple-choice 
                and text response questions.
              </p>
            </div>
            <FileUpload onUploadSuccess={handleUploadSuccess} />
            
            {/* Features Overview */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <CardTitle>Multiple Choice Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Comprehensive analysis of Likert scales, Yes/No questions, and categorical responses 
                    with interactive visualizations.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <CardTitle>Text Response Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Advanced NLP analysis of open-ended responses including sentiment analysis, 
                    word frequency, and theme extraction.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <CardTitle>AI-Powered Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Large Language Model analysis for deep insights, emotion detection, 
                    theme extraction, and actionable recommendations.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <CardTitle>Cross-Tabulation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Discover relationships between different survey questions with interactive 
                    cross-tabulation analysis.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="summary">
            {datasetInfo && <SummaryDashboard />}
          </TabsContent>

          <TabsContent value="multiple-choice">
            {datasetInfo && <MultipleChoiceAnalysis />}
          </TabsContent>

          <TabsContent value="text-analysis">
            {datasetInfo && <TextAnalysis />}
          </TabsContent>

          <TabsContent value="llm-analysis">
            {datasetInfo && <LLMAnalysis datasetInfo={datasetInfo} />}
          </TabsContent>

          <TabsContent value="cross-tab">
            {datasetInfo && <CrossTabulation datasetInfo={datasetInfo} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}