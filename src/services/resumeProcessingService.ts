import { resumeParsingService } from './resumeParsingService';
import { aiAnalysisService } from './aiAnalysisService';
import { supabaseService } from './supabaseService';
import { applicationStatusService } from './applicationStatusService';
import { 
  ResumeProcessingResult, 
  AIAnalysisResult, 
  Applicant, 
  JobPosting,
  AIAnalysisRequest 
} from '../types';

interface ProcessResumeOptions {
  file: File;
  notes?: string;
  jobPosting: JobPosting;
}

interface ProcessResumeResult {
  success: boolean;
  applicant?: Applicant;
  error?: string;
  processingDetails?: {
    parsingResult: ResumeProcessingResult;
    analysisResult?: AIAnalysisResult;
  };
}

class ResumeProcessingService {
  /**
   * Process resume: parse document -> extract info -> AI analysis -> save to database
   */
  async processResume(options: ProcessResumeOptions): Promise<ProcessResumeResult> {
    const { file, notes, jobPosting } = options;

    try {
      // Step 1: Parse resume document
      console.log('Step 1: Parsing resume document...');
      const parsingResult = await resumeParsingService.parseResume(file);
      
      if (!parsingResult.success) {
        return {
          success: false,
          error: parsingResult.error,
          processingDetails: { parsingResult }
        };
      }

      // Step 2: Extract personal information first
      console.log('Step 2: Extracting personal information...');
      let extractedInfo;
      let applicantName = '待提取';
      let applicantEmail = '';
      
      if (jobPosting.aiAnalysisEnabled && aiAnalysisService.isConfigured()) {
        try {
          console.log('Extracting personal info from content:', parsingResult.content?.substring(0, 200) + '...');
          extractedInfo = await aiAnalysisService.extractPersonalInfo(parsingResult.content!);
          applicantName = extractedInfo.name || '未提取到姓名';
          applicantEmail = extractedInfo.email || '';
          console.log('Personal info extracted successfully:', { name: applicantName, email: applicantEmail });
        } catch (error) {
          console.error('Failed to extract personal info:', error);
          console.error('Personal info extraction error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          extractedInfo = undefined;
        }
      }

      // Step 3: Create initial applicant record with extracted info
      console.log('Step 3: Creating applicant record...');
      
      // Get default status
      let defaultStatusId: string | undefined;
      try {
        const defaultStatus = await applicationStatusService.getStatusByName('pending');
        defaultStatusId = defaultStatus?.id;
      } catch (error) {
        console.warn('Failed to get default status, will use fallback:', error);
      }
      
      const initialApplicant: Partial<Applicant> = {
        name: applicantName,
        email: applicantEmail,
        jobPostingId: jobPosting.id,
        resumeFile: `resume_${Date.now()}_${file.name}`, // In real app, upload to storage
        resumeContent: parsingResult.content,
        resumeFileName: parsingResult.fileName,
        resumeFileSize: parsingResult.fileSize,
        extractedInfo: extractedInfo,
        processingStatus: 'processing',
        status: 'pending',
        statusId: defaultStatusId, // Use custom status if available
        isSelected: false,
        emailSent: false,
      };
      
      // Add notes if provided
      if (notes) {
        // We could store notes in a separate field or in the AI summary initially
        initialApplicant.aiSummary = `備註: ${notes}`;
      }

      console.log('Creating applicant with data:', initialApplicant);
      const applicant = await supabaseService.createApplicant(initialApplicant);
      console.log('Applicant created successfully:', applicant.id);

      // Step 4: AI Analysis (if enabled and configured)
      let analysisResult: AIAnalysisResult | undefined;
      
      console.log('AI Analysis Check:', {
        aiAnalysisEnabled: jobPosting.aiAnalysisEnabled,
        isConfigured: aiAnalysisService.isConfigured(),
        configMessage: aiAnalysisService.getConfigurationMessage()
      });
      
      if (jobPosting.aiAnalysisEnabled && aiAnalysisService.isConfigured()) {
        try {
          console.log('Step 4: Performing AI analysis...');
          
          const analysisRequest: AIAnalysisRequest = {
            resumeContent: parsingResult.content!,
            jobDescription: jobPosting.description,
            jobDescriptionDetail: jobPosting.jobDescriptionDetail,
            scoringCriteria: jobPosting.scoringCriteria!,
          };

          analysisResult = await aiAnalysisService.analyzeResume(analysisRequest);

          // Step 5: Update applicant with AI analysis results
          console.log('Step 5: Updating applicant with AI results...');
          
          // Merge notes with AI analysis if notes were provided
          let finalAiSummary = analysisResult.analysis;
          if (notes) {
            finalAiSummary = `備註: ${notes}\n\nAI 分析:\n${analysisResult.analysis}`;
          }
          
          await supabaseService.updateApplicant(applicant.id, {
            extractedInfo: analysisResult.extractedInfo,
            matchPercentage: analysisResult.matchPercentage,
            aiScore: analysisResult.matchPercentage, // For backward compatibility
            aiSummary: finalAiSummary,
            aiAnalysisSummary: this.formatAnalysisSummary(analysisResult),
            analysisCompleted: true,
            analysisCompletedAt: new Date(),
            processingStatus: 'completed',
          });

          console.log('AI analysis completed successfully');
        } catch (aiError) {
          console.error('AI analysis failed:', aiError);
          
          // Update applicant with failed status
          await supabaseService.updateApplicant(applicant.id, {
            processingStatus: 'failed',
            aiSummary: `AI 分析失敗: ${aiError instanceof Error ? aiError.message : '未知錯誤'}`,
          });
        }
      } else {
        // AI analysis not enabled or not configured
        console.log('Step 4: Skipping AI analysis (disabled or not configured)');
        
        // Still update with notes if provided
        let updateData: any = {
          processingStatus: 'completed',
          analysisCompleted: false,
        };
        
        if (notes) {
          updateData.aiSummary = `備註: ${notes}`;
        }
        
        await supabaseService.updateApplicant(applicant.id, updateData);
      }

      // Step 6: Get final applicant data
      const finalApplicant = await supabaseService.getApplicantsByJobId(jobPosting.id);
      const updatedApplicant = finalApplicant.find(a => a.id === applicant.id);

      return {
        success: true,
        applicant: updatedApplicant || applicant,
        processingDetails: {
          parsingResult,
          analysisResult,
        },
      };

    } catch (error) {
      console.error('Resume processing failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        error: error
      });
      return {
        success: false,
        error: `履歷處理失敗: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      };
    }
  }

  /**
   * Format AI analysis result for summary display
   */
  private formatAnalysisSummary(result: AIAnalysisResult): string {
    const sections = [];
    
    sections.push(`適配度: ${result.matchPercentage}%`);
    
    if (result.strengths.length > 0) {
      sections.push(`\n優勢:`);
      result.strengths.forEach(strength => {
        sections.push(`• ${strength}`);
      });
    }
    
    if (result.weaknesses.length > 0) {
      sections.push(`\n待改善:`);
      result.weaknesses.forEach(weakness => {
        sections.push(`• ${weakness}`);
      });
    }
    
    if (result.recommendations.length > 0) {
      sections.push(`\n建議:`);
      result.recommendations.forEach(recommendation => {
        sections.push(`• ${recommendation}`);
      });
    }
    
    return sections.join('\n');
  }

  /**
   * Re-analyze existing applicant with updated criteria
   */
  async reAnalyzeApplicant(applicantId: string, jobPosting: JobPosting): Promise<boolean> {
    try {
      const applicants = await supabaseService.getApplicantsByJobId(jobPosting.id);
      const applicant = applicants.find(a => a.id === applicantId);
      
      if (!applicant || !applicant.resumeContent) {
        throw new Error('找不到應徵者或履歷內容');
      }

      if (!jobPosting.aiAnalysisEnabled || !aiAnalysisService.isConfigured()) {
        throw new Error('AI 分析功能未啟用或未設定');
      }

      // Update status to processing
      await supabaseService.updateApplicant(applicantId, {
        processingStatus: 'processing',
      });

      const analysisRequest: AIAnalysisRequest = {
        resumeContent: applicant.resumeContent,
        jobDescription: jobPosting.description,
        jobDescriptionDetail: jobPosting.jobDescriptionDetail,
        scoringCriteria: jobPosting.scoringCriteria!,
      };

      const analysisResult = await aiAnalysisService.analyzeResume(analysisRequest);

      // Update applicant with new results
      await supabaseService.updateApplicant(applicantId, {
        extractedInfo: analysisResult.extractedInfo,
        matchPercentage: analysisResult.matchPercentage,
        aiScore: analysisResult.matchPercentage,
        aiSummary: analysisResult.analysis,
        aiAnalysisSummary: this.formatAnalysisSummary(analysisResult),
        analysisCompleted: true,
        analysisCompletedAt: new Date(),
        processingStatus: 'completed',
      });

      return true;
    } catch (error) {
      console.error('Re-analysis failed:', error);
      
      // Update status to failed
      await supabaseService.updateApplicant(applicantId, {
        processingStatus: 'failed',
        aiSummary: `重新分析失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
      });
      
      return false;
    }
  }

  /**
   * Batch re-analyze all applicants for a job
   */
  async reAnalyzeAllApplicants(jobPosting: JobPosting): Promise<{ success: number; failed: number }> {
    if (!jobPosting.aiAnalysisEnabled || !aiAnalysisService.isConfigured()) {
      throw new Error('AI 分析功能未啟用或未設定');
    }

    const applicants = await supabaseService.getApplicantsByJobId(jobPosting.id);
    const applicantsWithContent = applicants.filter(a => a.resumeContent);

    let success = 0;
    let failed = 0;

    for (const applicant of applicantsWithContent) {
      const result = await this.reAnalyzeApplicant(applicant.id, jobPosting);
      if (result) {
        success++;
      } else {
        failed++;
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { success, failed };
  }

  /**
   * Check processing status
   */
  getProcessingStatus(): {
    parsingSupported: boolean;
    aiAnalysisAvailable: boolean;
    supportedFormats: string[];
  } {
    return {
      parsingSupported: true,
      aiAnalysisAvailable: aiAnalysisService.isConfigured(),
      supportedFormats: resumeParsingService.getSupportedExtensions(),
    };
  }
}

export const resumeProcessingService = new ResumeProcessingService();