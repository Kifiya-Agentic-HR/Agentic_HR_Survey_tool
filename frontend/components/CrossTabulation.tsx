'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Download, GitBranch, TrendingUp, BarChart3, } from 'lucide-react';
import { authService } from '@/lib/auth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';



interface CrossTabData {
  question1: string;
  question2: string;
  crosstab_data: Array<{
    question1_value: string;
    [key: string]: string | number;
  }>;
  columns: string[];
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

interface CrossTabulationProps {
  datasetInfo: DatasetInfo;
}

export default function CrossTabulation({ datasetInfo }: CrossTabulationProps) {
  const [crossTabData, setCrossTabData] = useState<CrossTabData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question1, setQuestion1] = useState<string>('');
  const [question2, setQuestion2] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  const mcQuestions = datasetInfo.mc_column_names;
 
  useEffect(() => {
    // Set default questions
    if (mcQuestions.length >= 2) {
      setQuestion1(mcQuestions[0]);
      setQuestion2(mcQuestions[1]);
    }
  }, [mcQuestions]);

  const exportToPDF = async () => {
  if (!contentRef.current) return;

  try {
    // Create a new PDF instance
    const pdf = new jsPDF('p', 'pt', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();

    // Add title and date to the PDF
    pdf.setFontSize(20);
    pdf.text('Summary of The Survey', width / 2, 40, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, width / 2, 60, { align: 'center' });

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
    pdf.save('cross-tab-analysis-report.pdf');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};

  const fetchCrossTabulation = useCallback(async () => {
    if (!question1 || !question2 || question1 === question2) return;
    try {
      setLoading(true);
      setError(null);
      const response = await authService.makeAuthenticatedRequest(`/cross-tabulation/${encodeURIComponent(question1)}/${encodeURIComponent(question2)}`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cross-tabulation data');
      }
      const data = await response.json();
      setCrossTabData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCrossTabData(null);
    } finally {
      setLoading(false);
    }
  }, [question1, question2]);

  useEffect(() => {
    fetchCrossTabulation();
  }, [fetchCrossTabulation]);

  const calculateRowTotal = (row: any) => {
    return crossTabData?.columns.reduce((sum, col) => {
      const value = row[col];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0) || 0;
  };

  const calculateColumnTotal = (columnName: string) => {
    return crossTabData?.crosstab_data.reduce((sum, row) => {
      const value = row[columnName];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0) || 0;
  };

  const calculateGrandTotal = () => {
    return crossTabData?.crosstab_data.reduce((sum, row) => {
      return sum + calculateRowTotal(row);
    }, 0) || 0;
  };

  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  const getIntensityColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return 'rgba(59, 130, 246, 0.1)';
    const intensity = value / maxValue;
    return `rgba(59, 130, 246, ${0.1 + intensity * 0.4})`;
  };

  const findMaxValue = () => {
    if (!crossTabData) return 0;
    let max = 0;
    crossTabData.crosstab_data.forEach(row => {
      crossTabData.columns.forEach(col => {
        const value = row[col];
        if (typeof value === 'number' && value > max) {
          max = value;
        }
      });
    });
    return max;
  };

  const getCorrelationStrength = (question1Val: string, question2Val: string) => {
    if (!crossTabData) return 'Unknown';
    
    const row = crossTabData.crosstab_data.find(r => r.question1_value === question1Val);
    if (!row) return 'Unknown';
    
    const cellValue = row[question2Val];
    const rowTotal = calculateRowTotal(row);
    const colTotal = calculateColumnTotal(question2Val);
    const grandTotal = calculateGrandTotal();
    
    if (typeof cellValue !== 'number' || rowTotal === 0 || colTotal === 0 || grandTotal === 0) {
      return 'Unknown';
    }
    
    const expected = (rowTotal * colTotal) / grandTotal;
    const ratio = cellValue / expected;
    
    if (ratio > 1.5) return 'Strong';
    if (ratio > 1.2) return 'Moderate';
    if (ratio > 0.8) return 'Weak';
    return 'Very Weak';
  };

  if (mcQuestions.length < 2) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-orange-500 mx-auto" />
            <p className="text-gray-600">Need at least 2 multiple choice questions for cross-tabulation analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" ref={contentRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cross-Tabulation Analysis</h2>
          <p className="text-gray-600">
            Analyze relationships between multiple choice questions
          </p>
        </div>
         <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
      </div>

      {/* Question Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitBranch className="h-5 w-5 mr-2" />
            Select Questions to Compare
          </CardTitle>
          <CardDescription>
            Choose two multiple choice questions to analyze their relationship
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question 1 (Rows)</label>
              <Select value={question1} onValueChange={setQuestion1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first question" />
                </SelectTrigger>
                <SelectContent>
                  {mcQuestions.map((question) => (
                    <SelectItem key={question} value={question} disabled={question === question2}>
                      {question.length > 60 ? question.substring(0, 60) + '...' : question}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Question 2 (Columns)</label>
              <Select value={question2} onValueChange={setQuestion2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second question" />
                </SelectTrigger>
                <SelectContent>
                  {mcQuestions.map((question) => (
                    <SelectItem key={question} value={question} disabled={question === question1}>
                      {question.length > 60 ? question.substring(0, 60) + '...' : question}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Generating cross-tabulation...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-gray-600">{error}</p>
              <Button onClick={fetchCrossTabulation} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cross-Tabulation Results */}
      {crossTabData && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{calculateGrandTotal()}</div>
                <p className="text-xs text-muted-foreground">Valid cross-tabulated responses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Question 1 Options</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {crossTabData.crosstab_data.length - 1}
                </div>
                <p className="text-xs text-muted-foreground">Response categories</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Question 2 Options</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {crossTabData.columns.length - 1}
                </div>
                <p className="text-xs text-muted-foreground">Response categories</p>
              </CardContent>
            </Card>
          </div>

          {/* Question Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Question 1 (Rows)</CardTitle>
                <CardDescription className="text-sm">{crossTabData.question1}</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Question 2 (Columns)</CardTitle>
                <CardDescription className="text-sm">{crossTabData.question2}</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Cross-Tabulation Table */}
          <Card>
            <CardHeader>
              <CardTitle>Cross-Tabulation Table</CardTitle>
              <CardDescription>
                Response counts showing the relationship between the two questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Response</TableHead>
                      {crossTabData.columns.map((col) => (
                        <TableHead key={col} className="text-center font-semibold">
                          {col}
                        </TableHead>
                      ))}
                      <TableHead className="text-center font-semibold bg-gray-50">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crossTabData.crosstab_data
                      .filter(row => row.question1_value !== 'All')
                      .map((row, index) => {
                        const rowTotal = calculateRowTotal(row);
                        const maxValue = findMaxValue();
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {row.question1_value}
                            </TableCell>
                            {crossTabData.columns
                              .filter(col => col !== 'All')
                              .map((col) => {
                                const value = row[col];
                                const numValue = typeof value === 'number' ? value : 0;
                                const percentage = calculatePercentage(numValue, rowTotal);
                                
                                return (
                                  <TableCell 
                                    key={col} 
                                    className="text-center relative"
                                    style={{ 
                                      backgroundColor: getIntensityColor(numValue, maxValue)
                                    }}
                                  >
                                    <div className="font-semibold">{numValue}</div>
                                    <div className="text-xs text-gray-500">
                                      ({percentage}%)
                                    </div>
                                  </TableCell>
                                );
                              })}
                            <TableCell className="text-center font-semibold bg-gray-50">
                              {rowTotal}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    
                    {/* Totals Row */}
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell>Total</TableCell>
                      {crossTabData.columns
                        .filter(col => col !== 'All')
                        .map((col) => (
                          <TableCell key={col} className="text-center">
                            {calculateColumnTotal(col)}
                          </TableCell>
                        ))}
                      <TableCell className="text-center">
                        {calculateGrandTotal()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>
                Statistical observations from the cross-tabulation analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Response Distribution</h4>
                  <div className="space-y-2">
                    {crossTabData.crosstab_data
                      .filter(row => row.question1_value !== 'All')
                      .map((row, index) => {
                        const rowTotal = calculateRowTotal(row);
                        const percentage = calculatePercentage(rowTotal, calculateGrandTotal());
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate mr-2">{row.question1_value}</span>
                            <Badge variant="secondary">
                              {rowTotal} ({percentage}%)
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Column Distribution</h4>
                  <div className="space-y-2">
                    {crossTabData.columns
                      .filter(col => col !== 'All')
                      .map((col, index) => {
                        const colTotal = calculateColumnTotal(col);
                        const percentage = calculatePercentage(colTotal, calculateGrandTotal());
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate mr-2">{col}</span>
                            <Badge variant="secondary">
                              {colTotal} ({percentage}%)
                            </Badge>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}