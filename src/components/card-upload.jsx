'use client';;
import { useEffect, useState } from 'react';
import { formatBytes, useFileUpload } from '@/hooks/use-file-upload';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileArchiveIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  RefreshCwIcon,
  TriangleAlert,
  Upload,
  VideoIcon,
  XIcon,
} from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';

export default function CardUpload({
  maxFiles = 10,

  // 50MB
  maxSize = 50 * 1024 * 1024,

  accept = '*',
  multiple = true,
  className,
  onFilesChange,
  simulateUpload = true,
  initialFiles = [],
  defaultFilesEnabled = true,
}) {
  // Create default files using FileMetadata type
  const defaultFiles = defaultFilesEnabled ? [
    {
      id: 'default-card-1',
      name: 'intro.zip',
      size: 252846,
      type: 'application/zip',
      url: toAbsoluteUrl('/media/files/intro.zip'),
    },
    {
      id: 'default-card-2',
      name: 'image-01.jpg',
      size: 1536000,
      type: 'image/jpeg',
      url: 'https://picsum.photos/1000/800?grayscale&random=3',
    },
    {
      id: 'default-card-3',
      name: 'audio.mp3',
      size: 1536000,
      type: 'audio/mpeg',
      url: toAbsoluteUrl('/media/files/audio.mp3'),
    },
  ] : initialFiles;

  // Convert default files to FileUploadItem format
  const defaultUploadFiles = defaultFiles.map((file) => ({
    id: file.id,
    file: {
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type
    },
    preview: file.url,
    progress: 100,
    status: "completed",
  }));

  const [uploadFiles, setUploadFiles] = useState(defaultUploadFiles);

  const [
    { isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    initialFiles: defaultFiles,
    onFilesChange: (newFiles) => {
      // Convert to upload items when files change, preserving existing status
      const newUploadFiles = newFiles.map((file) => {
        // Check if this file already exists in uploadFiles
        const existingFile = uploadFiles.find((existing) => existing.id === file.id);

        if (existingFile) {
          // Preserve existing file status and progress
          return {
            ...existingFile,
            ...file, // Update any changed properties from the file
          };
        } else {
          // New file - set to uploading
          return {
            ...file,
            progress: 0,
            status: "uploading",
          };
        }
      });

      setUploadFiles(newUploadFiles);
      onFilesChange?.(newUploadFiles);
    },
  });

  // Simulate upload progress for new files
  useEffect(() => {
    if (!simulateUpload) return;

    const uploadingFiles = uploadFiles.filter((file) => file.status === 'uploading');
    if (uploadingFiles.length === 0) return;

    const interval = setInterval(() => {
      setUploadFiles((prev) =>
        prev.map((file) => {
          if (file.status !== 'uploading') return file;

          const increment = Math.random() * 20 + 5; // Random increment between 5-25%
          const newProgress = Math.min(file.progress + increment, 100);

          if (newProgress >= 100) {
            // Simulate occasional failures (10% chance)
            const shouldFail = Math.random() < 0.1;
            return {
              ...file,
              progress: 100,
              status: shouldFail ? ("error") : ("completed"),
              error: shouldFail ? 'Upload failed. Please try again.' : undefined,
            };
          }

          return { ...file, progress: newProgress };
        }));
    }, 500);

    return () => clearInterval(interval);
  }, [uploadFiles, simulateUpload]);

  const removeUploadFile = (fileId) => {
    const fileToRemove = uploadFiles.find((f) => f.id === fileId);
    if (fileToRemove) {
      removeFile(fileToRemove.id);
    }
  };

  const retryUpload = (fileId) => {
    setUploadFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, progress: 0, status: "uploading", error: undefined } : file));
  };

  const getFileIcon = (file) => {
    const type = file instanceof File ? file.type : file.type;
    if (type.startsWith('image/')) return <ImageIcon className="size-6" />;
    if (type.startsWith('video/')) return <VideoIcon className="size-6" />;
    if (type.startsWith('audio/')) return <HeadphonesIcon className="size-6" />;
    if (type.includes('pdf')) return <FileTextIcon className="size-6" />;
    if (type.includes('word') || type.includes('doc')) return <FileTextIcon className="size-6" />;
    if (type.includes('excel') || type.includes('sheet')) return <FileSpreadsheetIcon className="size-6" />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchiveIcon className="size-6" />;
    return <FileTextIcon className="size-6" />;
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={cn(
          'relative rounded-lg border border-dashed p-6 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}>
        <input {...getInputProps()} className="sr-only" />

        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors',
              isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
            )}>
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Suelta archivos aquí o{' '}
              <button
                type="button"
                onClick={openFileDialog}
                className="cursor-pointer text-primary underline-offset-4 hover:underline">
                examinar archivos
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              Tamaño máximo de archivo: {formatBytes(maxSize)} • Máximo de archivos: {maxFiles}
            </p>
          </div>
        </div>
      </div>
      {/* Files Grid */}
      {uploadFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Files ({uploadFiles.length})</h3>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {uploadFiles.map((fileItem) => (
              <div key={fileItem.id} className="relative group">
                {/* Remove button */}
                <Button
                  onClick={() => removeUploadFile(fileItem.id)}
                  variant="outline"
                  size="icon"
                  className="absolute -end-1 -top-1 z-10 size-5 rounded-full opacity-0 transition-opacity group-hover:opacity-100">
                  <XIcon className="size-2.5" />
                </Button>

                {/* Wrapper */}
                <div
                  className="relative overflow-hidden rounded-lg border bg-card transition-colors">
                  {/* Image preview or file icon area */}
                  <div className="relative aspect-[3/2] bg-muted border-b border-border">
                    {fileItem.file.type.startsWith('image/') && fileItem.preview ? (
                      <>
                        {/* Image cover */}
                        <img
                          src={fileItem.preview}
                          alt={fileItem.file.name}
                          className="h-full w-full object-cover" />
                        {/* Se quita el overlay de progreso: subida ocurrirá al guardar */}
                      </>
                    ) : (
                      /* File icon area for non-images */
                      (<div
                        className="flex h-full items-center justify-center text-muted-foreground/80">
                        <div className="text-2xl">{getFileIcon(fileItem.file)}</div>
                      </div>)
                    )}
                  </div>

                  {/* File info footer */}
                  <div className="p-2">
                    <div className="space-y-1">
                      <p className="truncate text-xs font-medium">{fileItem.file.name}</p>
                      <div className="relative flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{formatBytes(fileItem.file.size)}</span>

                        {fileItem.status === 'error' && fileItem.error && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={() => retryUpload(fileItem.id)}
                                variant="ghost"
                                size="icon"
                                className="absolute end-0 -top-1.25 size-6 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <RefreshCwIcon className="size-3 opacity-100" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Error al subir. Reintentar</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert variant="destructive" appearance="light" className="mt-5">
          <AlertIcon>
            <TriangleAlert />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>File upload error(s)</AlertTitle>
            <AlertDescription>
              {errors.map((error, index) => (
                <p key={index} className="last:mb-0">
                  {error}
                </p>
              ))}
            </AlertDescription>
          </AlertContent>
        </Alert>
      )}
    </div>
  );
}
