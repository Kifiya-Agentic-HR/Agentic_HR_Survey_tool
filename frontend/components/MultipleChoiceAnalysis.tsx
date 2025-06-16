'use client';

import { useState, useEffect } from 'react';
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
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Download,
  Filter
} from 'lucide-react';
import { authService } from '@/lib/auth';
const API_BASE_URL = 'http://localhost:8000';

interface ChartData {
  label: string;
  value: number;
  percentage: number;
}

interface QuestionAnalysis {
  question: string;
  total_responses: number;
  unique_values: number;
  value_counts: { [key: string]: number };
  percentages: { [key: string]: number };
  chart_data: ChartData[];
  missing_values: number;
}

interface MultipleChoiceData {
  analysis: { [key: string]: QuestionAnalysis };
  summary: {
    total_questions: number;
    avg_response_rate: number;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EF4444', '#6366F1', '#14B8A6', '#F59E0B'];

export default function MultipleChoiceAnalysis() {
  const [data, setData] = useState<MultipleChoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);

      const response = await authService.makeAuthenticatedRequest('/multiple-choice-analysis', {
      method: 'GET',
    });
      
      
      if (!response.ok) {
        throw new Error('Failed to fetch multiple choice analysis');
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

  const renderChart = (questionData: QuestionAnalysis) => {
    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={questionData.chart_data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => `${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {questionData.chart_data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [value, 'Responses']} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={questionData.chart_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="label" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number, name: string) => [value, 'Responses']}
            labelFormatter={(label) => `Response: ${label}`}
          />
          <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderOverview = () => {
    if (!data) return null;

    const questions = Object.entries(data.analysis);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map(([questionKey, questionData]) => (
          <Card key={questionKey} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedQuestion(questionKey);
                  setViewMode('detailed');
                }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">{questionData.question}</CardTitle>
              <CardDescription>
                {questionData.total_responses} responses • {questionData.unique_values} options
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
              
              {/* Mini chart preview */}
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionData.chart_data.slice(0, 5)}>
                    <Bar dataKey="value" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Responses']}
                      labelFormatter={(label) => `${label}`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Top response:</span>
                <span className="font-medium">
                  {questionData.chart_data[0]?.label || 'N/A'} ({questionData.chart_data[0]?.percentage.toFixed(1) || 0}%)
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
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
                <CardDescription>Detailed analysis and visualizations</CardDescription>
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
                <div className="text-2xl font-bold text-green-600">{questionData.unique_values}</div>
                <div className="text-sm text-gray-600">Response Options</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {((questionData.total_responses / (questionData.total_responses + questionData.missing_values)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Response Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{questionData.missing_values}</div>
                <div className="text-sm text-gray-600">Missing Values</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Controls and Visualization */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Response Distribution</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant={chartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Bar Chart
                </Button>
                <Button
                  variant={chartType === 'pie' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('pie')}
                >
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Pie Chart
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderChart(questionData)}
          </CardContent>
        </Card>

        {/* Response Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
            <CardDescription>Complete response statistics for each option</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {questionData.chart_data
                .sort((a, b) => b.value - a.value)
                .map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{item.value} responses</span>
                    <Badge variant="secondary">{item.percentage.toFixed(1)}%</Badge>
                    <div className="w-20">
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
            <p className="text-gray-600">Failed to load multiple choice analysis</p>
            <Button onClick={fetchAnalysis} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Multiple Choice Analysis</h2>
          <p className="text-gray-600">
            Analyzing {data.summary.total_questions} multiple choice questions with {data.summary.avg_response_rate.toFixed(1)}% average response rate
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
            <Filter className="h-4 w-4 mr-2" />
            Overview
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'overview' ? renderOverview() : renderDetailed()}
    </div>
  );
}