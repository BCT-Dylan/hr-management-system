export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  jobType: string;
  description: string;
  attachments?: string[];
  isPublic: boolean;
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
  uploadedAt: Date;
  aiScore?: number;
  aiSummary?: string;
  status: 'pending' | 'reviewed' | 'selected' | 'rejected';
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