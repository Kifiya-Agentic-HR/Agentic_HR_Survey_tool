'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Eye, 
  AlertCircle, 
  Download,
  Search,
  Hash,
  Clock
} from 'lucide-react';
import { authService } from '@/lib/auth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
const API_BASE_URL = 'http://localhost:8000';

interface WordData {
  word: string;
  count: number;
}

interface TextQuestionAnalysis {
  question: string;
  total_responses: number;
  avg_length: number;
  min_length: number;
  max_length: number;
  common_words: WordData[];
  sample_responses: string[];
  missing_values: number;
}

interface TextAnalysisData {
  analysis: { [key: string]: TextQuestionAnalysis };
  summary: {
    total_text_questions: number;
    avg_response_rate: number;
  };
}

export default function TextAnalysis() {
  const [data, setData] = useState<TextAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [selectedResponse, setSelectedResponse] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);

      const response = await authService.makeAuthenticatedRequest('/text-analysis', {
            method: 'GET',
          });
     
      
      if (!response.ok) {
        throw new Error('Failed to fetch text analysis');
      }
      
      const result = await response.json();
      setData(result);
      
      // Set default selected question
      if (result.analysis && Object.keys(result.analysis).length > 0) {
        setSelectedQuestion(Object.keys(result.analysis)[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getResponseLengthCategory = (length: number) => {
    if (length < 50) return 'Short';
    if (length < 150) return 'Medium';
    if (length < 300) return 'Long';
    return 'Very Long';
  };

  const getResponseLengthColor = (category: string) => {
    switch (category) {
      case 'Short': return '#EF4444';
      case 'Medium': return '#F97316';
      case 'Long': return '#10B981';
      case 'Very Long': return '#3B82F6';
      default: return '#6B7280';
    }
  };
  const exportToPDF = async () => {
  if (!contentRef.current) return;

  try {
    // Create a new PDF instance
    const pdf = new jsPDF('p', 'pt', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    
    // Capture the content as canvas
    const canvas = await html2canvas(contentRef.current, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      scrollY: -window.scrollY
    });

    // Calculate the aspect ratio to fit the content properly
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = width - 40; // Margin of 20 on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 80; // Start position after title
    const pageHeight = height - 100; // Leave some margin at bottom

    // Add content to PDF, splitting across pages if needed
    if (imgHeight < pageHeight) {
      pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
    } else {
      let remainingHeight = imgHeight;
      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
        position -= pageHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          position = 20; // Reset position for new page
        }
      }
    }

    // Save the PDF
    pdf.save('tesx-analysis-report.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
  const renderOverview = () => {
    if (!data) return null;

    const questions = Object.entries(data.analysis);
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Text Questions</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.summary.total_text_questions}</div>
              <p className="text-xs text-muted-foreground">Open-ended questions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.summary.avg_response_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Text completion rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(data.analysis).reduce((sum, q) => sum + q.total_responses, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Text responses collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Question Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {questions.map(([questionKey, questionData]) => (
            <Card key={questionKey} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedQuestion(questionKey);
                    setViewMode('detailed');
                  }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-2">{questionData.question}</CardTitle>
                <CardDescription>
                  {questionData.total_responses} responses • Avg {questionData.avg_length.toFixed(0)} characters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Response Rate</span>
                  <Badge variant="secondary">
                    {((questionData.total_responses / (questionData.total_responses + questionData.missing_values)) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={(questionData.total_responses / (questionData.total_responses + questionData.missing_values)) * 100} 
                  className="h-2" 
                />
                
                {/* Top words preview */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Most Common Words:</span>
                  <div className="flex flex-wrap gap-1">
                    {questionData.common_words.slice(0, 5).map((word, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {word.word} ({word.count})
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Length distribution */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Response Length:</span>
                  <div className="text-xs text-gray-600">
                    Min: {questionData.min_length} • Max: {questionData.max_length} • Avg: {questionData.avg_length.toFixed(0)} chars
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderDetailed = () => {
    if (!data || !selectedQuestion || !data.analysis[selectedQuestion]) return null;

    const questionData = data.analysis[selectedQuestion];
    
    return (
      <div className="space-y-6">
        {/* Question Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl">{questionData.question}</CardTitle>
                <CardDescription>Detailed text analysis and insights</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('overview')}
                >
                  Back to Overview
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{questionData.total_responses}</div>
                <div className="text-sm text-gray-600">Total Responses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{questionData.avg_length.toFixed(0)}</div>
                <div className="text-sm text-gray-600">Avg Length (chars)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{questionData.common_words.length}</div>
                <div className="text-sm text-gray-600">Unique Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{questionData.missing_values}</div>
                <div className="text-sm text-gray-600">Missing Values</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Word Frequency Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Hash className="h-5 w-5 mr-2" />
              Word Frequency Analysis
            </CardTitle>
            <CardDescription>Most commonly used words in responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={questionData.common_words.slice(0, 15)} 
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="word" type="category" width={80} />
                  <Tooltip 
                    formatter={(value: number) => [value, 'Frequency']}
                    labelFormatter={(label) => `Word: ${label}`}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Response Length Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Response Length Statistics
            </CardTitle>
            <CardDescription>Distribution of response lengths</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Length Categories</h4>
                <div className="space-y-2">
                  {['Short (0-49)', 'Medium (50-149)', 'Long (150-299)', 'Very Long (300+)'].map((category, index) => {
                    const colors = ['#EF4444', '#F97316', '#10B981', '#3B82F6'];
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index] }}></div>
                        <span className="text-sm">{category}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Minimum:</span>
                    <span className="font-medium">{questionData.min_length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maximum:</span>
                    <span className="font-medium">{questionData.max_length} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average:</span>
                    <span className="font-medium">{questionData.avg_length.toFixed(0)} chars</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Quality Indicators</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Rate</span>
                    <Badge variant="secondary">
                      {((questionData.total_responses / (questionData.total_responses + questionData.missing_values)) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Engagement</span>
                    <Badge variant={questionData.avg_length > 100 ? "default" : "destructive"}>
                      {questionData.avg_length > 100 ? "High" : "Low"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sample Responses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Sample Responses
            </CardTitle>
            <CardDescription>Representative responses from participants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questionData.sample_responses.map((response, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      Response #{index + 1}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: getResponseLengthColor(getResponseLengthCategory(response.length)),
                        color: 'white'
                      }}
                    >
                      {response.length} chars • {getResponseLengthCategory(response.length)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {response}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-gray-600">Failed to load text analysis</p>
            <Button onClick={fetchAnalysis} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" ref={contentRef}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Text Response Analysis</h2>
          <p className="text-gray-600">
            Analyzing {data.summary.total_text_questions} text questions with {data.summary.avg_response_rate.toFixed(1)}% average response rate
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {viewMode === 'detailed' && (
            <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select question" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(data.analysis).map(([key, question]) => (
                  <SelectItem key={key} value={key}>
                    {question.question.length > 50 ? question.question.substring(0, 50) + '...' : question.question}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            onClick={() => setViewMode('overview')}
          >
            <Search className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'overview' ? renderOverview() : renderDetailed()}
    </div>
  );
}