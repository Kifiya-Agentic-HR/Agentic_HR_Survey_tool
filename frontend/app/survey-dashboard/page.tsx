'use client';

import { useState, useEffect, useRef } from 'react';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [exporting, setExporting] = useState(false)
  const [activeTab, setActiveTab] = useState('upload');
  const router = useRouter();
  const summaryRef = useRef<HTMLDivElement>(null);
  const mcRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const crossTabRef = useRef<HTMLDivElement>(null);
  const aiSentimentRef = useRef<HTMLDivElement>(null);
  const aiThemesRef = useRef<HTMLDivElement>(null);
  const aiEmotionsRef = useRef<HTMLDivElement>(null);
  const aiInsightsRef = useRef<HTMLDivElement>(null);

  // Separate refs for export-only (hidden) components
  const summaryExportRef = useRef<HTMLDivElement>(null);
  const mcExportRef = useRef<HTMLDivElement>(null);
  const textExportRef = useRef<HTMLDivElement>(null);
  const crossTabExportRef = useRef<HTMLDivElement>(null);
  const aiSentimentExportRef = useRef<HTMLDivElement>(null);
  const aiThemesExportRef = useRef<HTMLDivElement>(null);
  const aiEmotionsExportRef = useRef<HTMLDivElement>(null);
  const aiInsightsExportRef = useRef<HTMLDivElement>(null);

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
  

  const exportAllReports = async () => {
    setExporting(true); // Show all hidden sections
  
    // Wait for the DOM to update and render hidden sections
    await new Promise(resolve => setTimeout(resolve, 300)); // 300ms is usually enough
  
    const pdf = new jsPDF('p', 'pt', 'a4');
    const width = pdf.internal.pageSize.getWidth();
  
    // Use only the export refs for export
    const refs = [
      { ref: summaryExportRef, title: 'Summary Dashboard' },
      { ref: mcExportRef, title: 'Multiple Choice Analysis' },
      { ref: textExportRef, title: 'Text Analysis' },
      { ref: aiSentimentExportRef, title: 'AI Analysis - Sentiment' },
      { ref: aiThemesExportRef, title: 'AI Analysis - Themes' },
      { ref: aiEmotionsExportRef, title: 'AI Analysis - Emotions' },
      { ref: aiInsightsExportRef, title: 'AI Analysis - Insights' },
      { ref: crossTabExportRef, title: 'Cross Tabulation' },
    ];
  
    let firstPage = true;
  
    for (const { ref, title } of refs) {
      if (ref.current) {
        const canvas = await html2canvas(ref.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          scrollY: -window.scrollY,
        });
  
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = width - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
        if (!firstPage) pdf.addPage();
        firstPage = false;
  
        pdf.setFontSize(18);
        pdf.text(title, width / 2, 40, { align: 'center' });
        pdf.addImage(imgData, 'PNG', 20, 60, imgWidth, imgHeight);
      }
    }
  
    pdf.save('Survey-Analysis-Full-Report.pdf');
    setExporting(false); // Hide sections again
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
                <Button variant="outline" size="sm" onClick={exportAllReports}>
                  Export All Reports
                </Button>
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
            {datasetInfo && <div ref={summaryRef}><SummaryDashboard /></div>}
          </TabsContent>

          <TabsContent value="multiple-choice">
            {datasetInfo && <div ref={mcRef}><MultipleChoiceAnalysis /></div>}
          </TabsContent>

          <TabsContent value="text-analysis">
            {datasetInfo && <div ref={textRef}><TextAnalysis /></div>}
          </TabsContent>

          <TabsContent value="llm-analysis">
            {datasetInfo && <div ref={aiSentimentRef}><LLMAnalysis
              datasetInfo={datasetInfo}
              sentimentExportRef={aiSentimentRef}
              themesExportRef={aiThemesRef}
              emotionsExportRef={aiEmotionsRef}
              insightsExportRef={aiInsightsRef}
              exportMode={true}
            /></div>}
          </TabsContent>

          <TabsContent value="cross-tab">
            {datasetInfo && <div ref={crossTabRef}><CrossTabulation datasetInfo={datasetInfo} /></div>}
          </TabsContent>

          {/* Hidden containers for export (always rendered, but hidden) */}
          <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm', background: 'white' }}>
            {datasetInfo && <div ref={summaryExportRef}><SummaryDashboard /></div>}
            {datasetInfo && <div ref={mcExportRef}><MultipleChoiceAnalysis /></div>}
            {datasetInfo && <div ref={textExportRef}><TextAnalysis /></div>}
            {datasetInfo && <LLMAnalysis
              datasetInfo={datasetInfo}
              sentimentExportRef={aiSentimentExportRef}
              themesExportRef={aiThemesExportRef}
              emotionsExportRef={aiEmotionsExportRef}
              insightsExportRef={aiInsightsExportRef}
              exportMode={true}
            />}
            {datasetInfo && <div ref={crossTabExportRef}><CrossTabulation datasetInfo={datasetInfo} /></div>}
          </div>
        </Tabs>
      </main>
    </div>
  );
}