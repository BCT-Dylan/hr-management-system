/**
 * File Storage Service
 * Handles resume file upload, storage, and download functionality
 */

interface StoredFile {
  id: string;
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
  data: string; // Base64 encoded file data
  uploadedAt: Date;
}

class FileStorageService {
  private readonly STORAGE_KEY = 'hr_resume_files';

  /**
   * Store file in browser localStorage (for demo purposes)
   * In production, this would upload to cloud storage (AWS S3, Google Cloud, etc.)
   */
  async storeFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const fileId = this.generateFileId();
          const base64Data = reader.result as string;
          
          const storedFile: StoredFile = {
            id: fileId,
            fileName: `${fileId}_${file.name}`,
            originalName: file.name,
            size: file.size,
            mimeType: file.type,
            data: base64Data,
            uploadedAt: new Date()
          };
          
          // Store in localStorage
          const existingFiles = this.getStoredFiles();
          existingFiles[fileId] = storedFile;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingFiles));
          
          resolve(fileId);
        } catch (error) {
          reject(new Error('Failed to store file: ' + error));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get stored file by ID
   */
  getFile(fileId: string): StoredFile | null {
    const files = this.getStoredFiles();
    return files[fileId] || null;
  }

  /**
   * Download file by ID
   */
  downloadFile(fileId: string): boolean {
    try {
      const file = this.getFile(fileId);
      if (!file) {
        console.error('File not found:', fileId);
        return false;
      }

      // Convert base64 to blob
      const base64Data = file.data.split(',')[1]; // Remove data URL prefix
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.mimeType });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  }

  /**
   * Delete file by ID
   */
  deleteFile(fileId: string): boolean {
    try {
      const files = this.getStoredFiles();
      if (files[fileId]) {
        delete files[fileId];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Delete file failed:', error);
      return false;
    }
  }

  /**
   * Get file info without downloading
   */
  getFileInfo(fileId: string): Omit<StoredFile, 'data'> | null {
    const file = this.getFile(fileId);
    if (!file) return null;
    
    return {
      id: file.id,
      fileName: file.fileName,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt
    };
  }

  /**
   * Check if file exists
   */
  fileExists(fileId: string): boolean {
    return !!this.getFile(fileId);
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): { totalFiles: number; totalSize: number } {
    const files = this.getStoredFiles();
    const fileList = Object.values(files);
    
    return {
      totalFiles: fileList.length,
      totalSize: fileList.reduce((total, file) => total + file.size, 0)
    };
  }

  /**
   * Clean up old files (older than 30 days)
   */
  cleanupOldFiles(): number {
    const files = this.getStoredFiles();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let deletedCount = 0;
    
    Object.entries(files).forEach(([fileId, file]) => {
      if (new Date(file.uploadedAt) < thirtyDaysAgo) {
        delete files[fileId];
        deletedCount++;
      }
    });
    
    if (deletedCount > 0) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
    }
    
    return deletedCount;
  }

  /**
   * Clear all stored files
   */
  clearAllFiles(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Private helper methods
  private getStoredFiles(): Record<string, StoredFile> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to get stored files:', error);
      return {};
    }
  }

  private generateFileId(): string {
    return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileStorageService = new FileStorageService();