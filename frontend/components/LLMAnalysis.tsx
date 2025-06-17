'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Brain,
  Heart,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Download,
  Sparkles,
  Target,
  Users,
  Clock,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { authService } from '@/lib/auth';

const API_BASE_URL = 'http://localhost:8000';

interface SentimentData {
  sentiments: Array<{
    response_id: number;
    sentiment: string;
    score: number;
    confidence: number;
  }>;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  total_analyzed: number;
}

interface ThemeData {
  themes: Array<{
    name: string;
    description: string;
    frequency: number;
    percentage: number;
    representative_quotes: string[];
  }>;
  summary: string;
}

interface EmotionData {
  emotions: {
    [key: string]: {
      count: number;
      percentage: number;
    };
  };
  dominant_emotion: string;
  total_analyzed: number;
}

interface InsightsData {
  insights: string[];
  recommendations: string[];
  concerns: string[];
  highlights: string[];
  summary: string;
}

interface LLMAnalysisData {
  question: string;
  total_responses: number;
  sentiment_analysis: SentimentData;
  theme_analysis: ThemeData;
  emotion_analysis: EmotionData;
  insights: InsightsData;
  analysis_timestamp: string;
}

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

interface LLMAnalysisProps {
  datasetInfo: DatasetInfo;
}

const EMOTION_COLORS = {
  joy: '#10B981',
  sadness: '#3B82F6',
  anger: '#EF4444',
  fear: '#8B5CF6',
  surprise: '#F59E0B',
  disgust: '#6B7280',
  trust: '#06B6D4',
  anticipation: '#F97316',
};

const SENTIMENT_COLORS = ['#10B981', '#6B7280', '#EF4444'];

export default function LLMAnalysis({ datasetInfo }: LLMAnalysisProps) {
  const [analysisData, setAnalysisData] = useState<LLMAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [activeTab, setActiveTab] = useState('sentiment');
  const tabContentRef = useRef<HTMLDivElement>(null);

  const textQuestions = datasetInfo.text_column_names;

  useEffect(() => {
    if (textQuestions.length > 0) {
      setSelectedQuestion(textQuestions[0]);
    }
  }, [textQuestions]);

  useEffect(() => {
    if (selectedQuestion) {
      fetchLLMAnalysis();
    }
  }, [selectedQuestion]);

  const fetchLLMAnalysis = async () => {
    if (!selectedQuestion) return;

    try {
      setLoading(true);
      setError(null);

      const response = await authService.makeAuthenticatedRequest(
        `/llm-analysis/${encodeURIComponent(selectedQuestion)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch LLM analysis: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched LLM analysis data:', data);
      setAnalysisData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error fetching LLM analysis:', errorMessage);
      setError(errorMessage);
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchLLMAnalysis();
  }, []);

  const exportToPDF = async () => {
    if (!tabContentRef.current) {
      alert('No content to export.');
      return;
    }

    try {
      const canvas = await html2canvas(tabContentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: 1920, // Set a wider viewport for better chart rendering
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 60) / imgHeight);
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;

      pdf.setFontSize(16);
      pdf.text(
        `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analysis Report`,
        pdfWidth / 2,
        20,
        { align: 'center' }
      );
      pdf.setFontSize(10);
      pdf.text(`Question: ${selectedQuestion || 'N/A'}`, 10, 30);
      pdf.text(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}`, 10, 40);

      pdf.addImage(imgData, 'PNG', 10, 50, imgScaledWidth, imgScaledHeight);

      pdf.save(`${activeTab}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export to PDF. Please try again.');
    }
  };


  const renderSentimentAnalysis = () => {
    if (!analysisData?.sentiment_analysis) {
      console.warn('Sentiment analysis data is missing');
      return null;
    }

    const { sentiment_analysis } = analysisData;
    const sentimentData = [
      { name: 'Positive', value: sentiment_analysis.positive_count, color: SENTIMENT_COLORS[0] },
      { name: 'Neutral', value: sentiment_analysis.neutral_count, color: SENTIMENT_COLORS[1] },
      { name: 'Negative', value: sentiment_analysis.negative_count, color: SENTIMENT_COLORS[2] },
    ];

    const overallSentiment =
      sentiment_analysis.positive_count > sentiment_analysis.negative_count
        ? 'Positive'
        : sentiment_analysis.negative_count > sentiment_analysis.positive_count
        ? 'Negative'
        : 'Neutral';

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Sentiment</CardTitle>
              <Heart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{overallSentiment}</div>
              <p className="text-xs text-muted-foreground">
                Based on {sentiment_analysis.total_analyzed} responses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive Responses</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {((sentiment_analysis.positive_count / sentiment_analysis.total_analyzed) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {sentiment_analysis.positive_count} out of {sentiment_analysis.total_analyzed}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative Responses</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {((sentiment_analysis.negative_count / sentiment_analysis.total_analyzed) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {sentiment_analysis.negative_count} out of {sentiment_analysis.total_analyzed}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Breakdown of sentiment across all responses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {sentimentData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        {item.name}
                      </span>
                      <span className="text-sm text-gray-600">{item.value} responses</span>
                    </div>
                    <Progress
                      value={(item.value / sentiment_analysis.total_analyzed) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderThemeAnalysis = () => {
    if (!analysisData?.theme_analysis) {
      console.warn('Theme analysis data is missing');
      return null;
    }

    const { theme_analysis } = analysisData;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2" />
              Key Themes Summary
            </CardTitle>
            <CardDescription>{theme_analysis.summary}</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {theme_analysis.themes.map((theme, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{theme.name}</CardTitle>
                  <Badge variant="secondary">
                    {theme.frequency} mentions ({theme.percentage.toFixed(1)}%)
                  </Badge>
                </div>
                <CardDescription>{theme.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Frequency</span>
                    <Progress value={theme.percentage} className="h-2 mt-1" />
                  </div>

                  {theme.representative_quotes.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Representative Quotes:</span>
                      <div className="mt-2 space-y-2">
                        {theme.representative_quotes.slice(0, 2).map((quote, quoteIndex) => (
                          <blockquote
                            key={quoteIndex}
                            className="text-sm italic text-gray-600 border-l-4 border-blue-200 pl-3"
                          >
                            {quote}
                          </blockquote>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderEmotionAnalysis = () => {
    console.log('Rendering Emotion Analysis, analysisData:', analysisData);

    if (!analysisData?.emotion_analysis) {
      console.warn('Emotion analysis data is missing');
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Emotional Analysis Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">No emotion analysis data available.</p>
          </CardContent>
        </Card>
      );
    }

    const { emotion_analysis } = analysisData;
    console.log('Emotion analysis:', emotion_analysis);

    if (!emotion_analysis.emotions || !Object.keys(emotion_analysis.emotions).length) {
      console.warn('Emotion analysis emotions object is empty or invalid');
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Emotional Analysis Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {'No emotions detected in the responses.'}
            </p>
          </CardContent>
        </Card>
      );
    }

    const emotionData = Object.entries(emotion_analysis.emotions).map(([emotion, data]) => ({
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      count: data.count,
      percentage: data.percentage,
      color: EMOTION_COLORS[emotion.toLowerCase() as keyof typeof EMOTION_COLORS] || '#6B7280',
    }));

    console.log('Transformed emotionData:', emotionData);

    const radarData = emotionData.map((item) => ({
      emotion: item.emotion,
      value: item.percentage,
    }));

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Emotional Analysis Overview
            </CardTitle>
            <CardDescription>
              Dominant emotion:{' '}
              <Badge variant="default">{emotion_analysis.dominant_emotion || 'N/A'}</Badge>{' '}
              • Analyzed {emotion_analysis.total_analyzed || 0} responses
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Emotion Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="emotion" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Percentage"
                      dataKey="value"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emotion Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emotionData.length > 0 ? (
                  emotionData
                    .sort((a, b) => b.percentage - a.percentage)
                    .map((emotion, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: emotion.color }}
                            ></div>
                            {emotion.emotion}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-medium">{emotion.count}</span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({emotion.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <Progress value={emotion.percentage} className="h-2" />
                      </div>
                    ))
                ) : (
                  <p className="text-gray-600">No emotion breakdown available.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderInsights = () => {
    if (!analysisData?.insights) {
      console.warn('Insights data is missing');
      return null;
    }

    const { insights } = analysisData;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <Lightbulb className="h-5 w-5 mr-2" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <Target className="h-5 w-5 mr-2" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {insights.concerns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Areas of Concern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.concerns.map((concern, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{concern}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {insights.highlights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-orange-600">
                <Sparkles className="h-5 w-5 mr-2" />
                Positive Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Sparkles className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{highlight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {insights.summary && (
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{insights.summary}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (textQuestions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-gray-600">No text questions found in the dataset</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Brain className="h-6 w-6 mr-2 text-purple-600" />
            LLM-Powered Analysis
          </h2>
          <p className="text-gray-600">Advanced AI analysis of open-ended survey responses</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select question" />
            </SelectTrigger>
            <SelectContent>
              {textQuestions.map((question) => (
                <SelectItem key={question} value={question}>
                  {question.length > 50 ? question.substring(0, 50) + '...' : question}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={!analysisData || loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
         
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600">Analyzing responses with AI...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-gray-600">{error}</p>
              <Button onClick={fetchLLMAnalysis} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {analysisData && !loading && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{analysisData.question}</CardTitle>
              <CardDescription className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {analysisData.total_responses} responses
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Analyzed {new Date(analysisData.analysis_timestamp).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}
                </span>
              </CardDescription>
            </CardHeader>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sentiment" className="flex items-center space-x-2">
                <Heart className="h-4 w-4" />
                <span>Sentiment</span>
              </TabsTrigger>
              <TabsTrigger value="themes" className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>Themes</span>
              </TabsTrigger>
              <TabsTrigger value="emotions" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Emotions</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Insights</span>
              </TabsTrigger>
            </TabsList>

            <div ref={tabContentRef} className="mt-4 bg-white p-4 rounded-lg">
              <TabsContent value="sentiment">{renderSentimentAnalysis()}</TabsContent>
              <TabsContent value="themes">{renderThemeAnalysis()}</TabsContent>
              <TabsContent value="emotions">{renderEmotionAnalysis()}</TabsContent>
              <TabsContent value="insights">{renderInsights()}</TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}