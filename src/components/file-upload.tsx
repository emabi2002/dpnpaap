'use client';

import React, { useState, useRef, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  X,
  FileText,
  Image,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  projectId: string;
  userId: string;
  onUploadComplete?: (attachment: {
    fileName: string;
    fileUrl: string;
    description?: string;
  }) => void;
  disabled?: boolean;
  maxFileSize?: number; // in MB
  acceptedFileTypes?: string[];
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

const DEFAULT_MAX_SIZE = 10; // 10MB
const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
  'text/csv',
];

function getFileIcon(type: string) {
  if (type.startsWith('image/')) {
    return <Image className="h-5 w-5 text-sky-500" />;
  }
  if (type.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) {
    return <FileText className="h-5 w-5 text-emerald-500" />;
  }
  if (type.includes('word') || type.includes('document')) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }
  return <File className="h-5 w-5 text-slate-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function FileUpload({
  projectId,
  userId,
  onUploadComplete,
  disabled = false,
  maxFileSize = DEFAULT_MAX_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    if (!acceptedFileTypes.includes(file.type) && !acceptedFileTypes.includes('*')) {
      return 'File type not supported';
    }

    return null;
  }, [maxFileSize, acceptedFileTypes]);

  const uploadFile = useCallback(async (file: File, index: number) => {
    const supabase = getSupabaseClient();

    // Update status to uploading
    setUploadingFiles(prev =>
      prev.map((f, i) => (i === index ? { ...f, status: 'uploading' as const, progress: 0 } : f))
    );

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${projectId}/${timestamp}_${sanitizedName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      // Update status to success
      setUploadingFiles(prev =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'success' as const, progress: 100, url: fileUrl } : f
        )
      );

      // Call callback
      if (onUploadComplete) {
        onUploadComplete({
          fileName: file.name,
          fileUrl,
        });
      }

      toast.success(`Uploaded: ${file.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setUploadingFiles(prev =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'error' as const, error: errorMessage } : f
        )
      );

      toast.error(`Failed to upload: ${file.name}`, {
        description: errorMessage,
      });
    }
  }, [projectId, onUploadComplete]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Validate and prepare files
    const newFiles: UploadingFile[] = fileArray.map(file => {
      const error = validateFile(file);
      return {
        file,
        progress: 0,
        status: error ? 'error' as const : 'pending' as const,
        error: error || undefined,
      };
    });

    setUploadingFiles(prev => [...prev, ...newFiles]);

    // Start uploads with staggered timing to avoid race conditions
    const startIndex = uploadingFiles.length;
    newFiles.forEach((f, idx) => {
      if (f.status === 'pending') {
        setTimeout(() => {
          uploadFile(f.file, startIndex + idx);
        }, 100 * idx);
      }
    });
  }, [validateFile, uploadFile, uploadingFiles.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploadingFiles(prev => prev.filter(f => f.status !== 'success'));
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
          ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-slate-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <Upload className={`h-10 w-10 mx-auto mb-3 ${isDragging ? 'text-emerald-500' : 'text-slate-400'}`} />

        <p className="text-sm font-medium text-slate-700">
          {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          PDF, Word, Excel, Images up to {maxFileSize}MB
        </p>
      </div>

      {/* File List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              {uploadingFiles.filter(f => f.status === 'success').length} of {uploadingFiles.length} uploaded
            </p>
            {uploadingFiles.some(f => f.status === 'success') && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Clear completed
              </Button>
            )}
          </div>

          {uploadingFiles.map((file, index) => (
            <Card key={`${file.file.name}-${index}`} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* File Icon */}
                  {getFileIcon(file.file.type)}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.file.size)}
                    </p>
                  </div>

                  {/* Status */}
                  {file.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                  )}
                  {file.status === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="h-1 mt-2" />
                )}

                {/* Error Message */}
                {file.status === 'error' && file.error && (
                  <p className="text-xs text-red-500 mt-1">{file.error}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Simpler upload button component for inline use
export function UploadButton({
  projectId,
  userId,
  onUploadComplete,
  disabled = false,
}: Omit<FileUploadProps, 'maxFileSize' | 'acceptedFileTypes'>) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    const supabase = getSupabaseClient();
    setIsUploading(true);

    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${projectId}/${timestamp}_${sanitizedName}`;

      const { error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      if (onUploadComplete) {
        onUploadComplete({
          fileName: file.name,
          fileUrl: urlData.publicUrl,
        });
      }

      toast.success(`Uploaded: ${file.name}`);
    } catch (error) {
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={disabled || isUploading}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2" />
        )}
        {isUploading ? 'Uploading...' : 'Upload File'}
      </Button>
    </>
  );
}
