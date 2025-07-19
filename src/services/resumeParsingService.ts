import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ResumeProcessingResult } from '../types';

// Configure PDF.js worker for stable version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

class ResumeParsingService {
  /**
   * Parse PDF file and extract text content
   */
  async parsePDF(file: File): Promise<ResumeProcessingResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      
      let fullText = '';

      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return {
        success: true,
        content: fullText.trim(),
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        error: `PDF 解析失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
      };
    }
  }

  /**
   * Parse Word document (.docx) and extract text content
   */
  async parseWord(file: File): Promise<ResumeProcessingResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (result.messages.length > 0) {
        console.warn('Word parsing warnings:', result.messages);
      }

      return {
        success: true,
        content: result.value.trim(),
        fileName: file.name,
        fileSize: file.size,
      };
    } catch (error) {
      console.error('Word parsing error:', error);
      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        error: `Word 文件解析失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
      };
    }
  }

  /**
   * Parse resume file based on file type
   */
  async parseResume(file: File): Promise<ResumeProcessingResult> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        error: '檔案大小超過 10MB 限制',
      };
    }

    // Determine file type and parse accordingly
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.parsePDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return this.parseWord(file);
    } else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        error: '不支援舊版 Word 格式 (.doc)，請使用 .docx 格式',
      };
    } else {
      return {
        success: false,
        fileName: file.name,
        fileSize: file.size,
        error: '不支援的檔案格式，僅支援 PDF 和 Word (.docx) 檔案',
      };
    }
  }

  /**
   * Validate if file is a supported resume format
   */
  isSupportedFormat(file: File): boolean {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    return (
      fileType === 'application/pdf' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.pdf') ||
      fileName.endsWith('.docx')
    );
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return ['.pdf', '.docx'];
  }

  /**
   * Get file type description for UI
   */
  getFileTypeDescription(): string {
    return 'PDF 或 Word 文件 (.pdf, .docx)';
  }
}

export const resumeParsingService = new ResumeParsingService();