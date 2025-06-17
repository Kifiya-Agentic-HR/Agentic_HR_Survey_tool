'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { authService } from '@/lib/auth';

const API_BASE_URL = 'http://localhost:8000';

interface SummaryStats {
  total_responses: number;
  total_questions: number;
  multiple_choice_questions: number;
  text_questions: number;
  avg_mc_response_rate: number;
  avg_text_response_rate: number;
  question_completeness: {
    [key: string]: {
      question: string;
      response_rate: number;
      missing_count: number;
    };
  };
}

export default function SummaryDashboard() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummaryStats();
  }, []);

  const fetchSummaryStats = async () => {
    try {
      setLoading(true);
      const response = await authService.makeAuthenticatedRequest('/summary-stats', {
      method: 'GET',
    });
      
      if (!response.ok) {
        throw new Error('Failed to fetch summary statistics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-gray-600">Failed to load summary statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for response rate chart
  const responseRateData = [
    {
      type: 'Multiple Choice',
      rate: stats.avg_mc_response_rate,
      color: '#3B82F6'
    },
    {
      type: 'Text Responses',
      rate: stats.avg_text_response_rate,
      color: '#10B981'
    }
  ];

  // Prepare data for question completeness chart
  const completenessData = Object.values(stats.question_completeness)
    .slice(0, 10) // Show top 10 questions
    .map(q => ({
      question: q.question.length > 20 ? q.question.substring(0, 20) + '...' : q.question,
      rate: q.response_rate,
      missing: q.missing_count
    }))
    .sort((a, b) => a.rate - b.rate);

  // Pie chart data for question types
  const questionTypeData = [
    { name: 'Multiple Choice', value: stats.multiple_choice_questions, color: '#3B82F6' },
    { name: 'Text Response', value: stats.text_questions, color: '#10B981' }
  ];

  return (
    <div className="space-y-8">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total_responses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Survey participants</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.total_questions}</div>
            <p className="text-xs text-muted-foreground">Survey questions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MC Response Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.avg_mc_response_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Multiple choice avg</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Text Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.avg_text_response_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Text response avg</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Rate Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Response Rate Comparison</CardTitle>
            <CardDescription>Average response rates by question type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {responseRateData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.type}</span>
                    <span className="text-sm text-gray-600">{item.rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={item.rate} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Question Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Question Type Distribution</CardTitle>
            <CardDescription>Breakdown of question types in your survey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={questionTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {questionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {questionTypeData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Question Completeness Chart 
      <Card>
        <CardHeader>
          <CardTitle>Question Response Rates</CardTitle>
          <CardDescription>Response completion rates for individual questions (showing lowest rates first)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={completenessData}
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="question" type="category" width={100} />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Response Rate']}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="rate" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card> 
      */}

      {/* Response Quality Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Overall Completeness</span>
                <Badge variant="secondary">
                  {((stats.avg_mc_response_rate + stats.avg_text_response_rate) / 2).toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Multiple Choice</span>
                <Badge variant={stats.avg_mc_response_rate > 80 ? "default" : "destructive"}>
                  {stats.avg_mc_response_rate.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Text Responses</span>
                <Badge variant={stats.avg_text_response_rate > 60 ? "default" : "destructive"}>
                  {stats.avg_text_response_rate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Survey Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Questions</span>
                <Badge variant="outline">{stats.total_questions}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Multiple Choice</span>
                <Badge variant="outline">{stats.multiple_choice_questions}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Text Responses</span>
                <Badge variant="outline">{stats.text_questions}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sample Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Responses</span>
                <Badge variant="outline">{stats.total_responses.toLocaleString()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Statistical Power</span>
                <Badge variant={stats.total_responses > 100 ? "default" : "destructive"}>
                  {stats.total_responses > 1000 ? "Excellent" : stats.total_responses > 300 ? "Good" : stats.total_responses > 100 ? "Fair" : "Low"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Margin of Error</span>
                <Badge variant="secondary">
                  ±{(1.96 * Math.sqrt(0.25 / stats.total_responses) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}