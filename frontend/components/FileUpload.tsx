'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService } from '@/lib/auth';

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

interface FileUploadProps {
  onUploadSuccess: (info: DatasetInfo) => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      }
    }
  };

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    
    return validTypes.includes(file.type) || validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await authService.makeAuthenticatedRequest('/upload', {
        method: 'POST',
        body: formData,
        headers: {} // Don't set Content-Type for FormData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      setSuccess(true);
      onUploadSuccess(result);
      
      // Reset form after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setSuccess(false);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Survey Data</CardTitle>
          <CardDescription>
            Upload your survey dataset in CSV or Excel format. Ensure your data has multiple-choice 
            questions followed by text response questions in the last three columns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".csv,.xlsx,.xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports CSV, XLSX, and XLS files up to 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!uploading && !success && (
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              {success && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                File uploaded successfully! You can now proceed with the analysis.
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || success}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : success ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Upload Complete
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload and Analyze
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Data Format Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Format Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <p className="text-sm text-gray-600">
              <strong>Multiple-choice questions</strong> should be in all columns except the last three
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
            <p className="text-sm text-gray-600">
              <strong>Text response questions</strong> should be in the last three columns
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
            <p className="text-sm text-gray-600">
              <strong>Column headers</strong> should contain the question text or identifiers
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
            <p className="text-sm text-gray-600">
              <strong>Missing responses</strong> can be left blank or marked as empty cells
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}