export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  jobType: string;
  description: string;
  jobDescriptionDetail?: string; // New: Detailed JD for AI analysis
  attachments?: string[];
  isPublic: boolean;
  scoringCriteria?: ScoringCriteria; // New: AI evaluation criteria
  aiAnalysisEnabled?: boolean; // New: Enable/disable AI analysis
  createdAt: Date;
  updatedAt: Date;
  applicantCount: number;
}

export interface FilterCriteria {
  id: string;
  jobPostingId: string;
  experienceRange: {
    min: number;
    max: number;
  };
  educationRequirement: string;
  skillKeywords: string[];
  languageRequirement: string[];
  notes?: string;
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  jobPostingId: string;
  resumeFile: string;
  resumeContent?: string; // New: Extracted resume text content
  resumeFileName?: string; // New: Original filename
  resumeFileSize?: number; // New: File size in bytes
  uploadedAt: Date;
  aiScore?: number;
  aiSummary?: string;
  extractedInfo?: ExtractedInfo; // New: AI extracted personal information
  matchPercentage?: number; // New: AI calculated match score (0-100)
  analysisCompleted?: boolean; // New: Analysis completion status
  analysisCompletedAt?: Date; // New: Analysis completion timestamp
  aiAnalysisSummary?: string; // New: Detailed AI analysis summary
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed'; // New: Processing workflow status
  status: string; // Changed: Now uses custom status names instead of fixed enum
  statusId?: string; // New: Reference to custom status
  isSelected: boolean;
  emailSent: boolean;
  emailSentAt?: Date;
  lastEmailType?: 'interview' | 'rejection';
  lastEmailDate?: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  purpose: string;
  subject: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'hr' | 'admin';
}

// New AI-related interfaces

export interface ScoringCriteria {
  technical_skills: {
    weight: number;
    required_skills: string[];
    preferred_skills?: string[];
  };
  experience: {
    weight: number;
    min_years: number;
    preferred_domains?: string[];
  };
  education: {
    weight: number;
    min_degree: 'high_school' | 'associate' | 'bachelor' | 'master' | 'doctorate';
    preferred_majors?: string[];
  };
  languages: {
    weight: number;
    required_languages: string[];
  };
  soft_skills: {
    weight: number;
    preferred_skills?: string[];
  };
}

export interface ExtractedInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  languages?: LanguageSkill[];
  education?: Education[];
  experience?: Experience[];
  skills?: string[];
  summary?: string;
}

export interface LanguageSkill {
  language: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'native' | 'professional';
}

export interface Education {
  degree: string;
  major?: string;
  school: string;
  graduation_year?: number;
  gpa?: number;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  skills?: string[];
  achievements?: string[];
}

export interface AIAnalysisResult {
  matchPercentage: number;
  extractedInfo: ExtractedInfo;
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// Resume processing interfaces
export interface ResumeProcessingResult {
  success: boolean;
  content?: string;
  fileName: string;
  fileSize: number;
  error?: string;
}

export interface AIAnalysisRequest {
  resumeContent: string;
  jobDescription: string;
  jobDescriptionDetail?: string;
  scoringCriteria: ScoringCriteria;
}

// Custom application status interfaces
export interface ApplicationStatus {
  id: string;
  name: string; // Internal name (e.g., 'pending', 'reviewed')
  displayName: string; // User-friendly name (e.g., '待審核', '已審核')
  description?: string;
  color: string; // Hex color code
  isDefault: boolean; // Whether this is a system default status
  isActive: boolean; // Whether this status is currently active
  sortOrder: number; // Display order
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApplicationStatusRequest {
  name: string;
  displayName: string;
  description?: string;
  color: string;
  sortOrder?: number;
}

export interface UpdateApplicationStatusRequest {
  displayName?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// API response interfaces
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}