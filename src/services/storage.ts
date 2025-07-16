import { JobPosting, Applicant, FilterCriteria, EmailTemplate } from '../types';

class StorageService {
  private readonly STORAGE_KEYS = {
    JOBS: 'hr_jobs',
    APPLICANTS: 'hr_applicants',
    FILTERS: 'hr_filters',
    TEMPLATES: 'hr_templates',
    USER: 'hr_user'
  };

  // Initialize with default data if localStorage is empty
  private initializeDefaultData() {
    if (!this.getJobs().length) {
      const defaultJobs: JobPosting[] = [
        {
          id: '1',
          title: '前端工程師',
          department: '技術部',
          location: '台北',
          jobType: '全職',
          description: '負責前端開發工作，需熟悉React和TypeScript',
          isPublic: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          applicantCount: 2
        },
        {
          id: '2',
          title: '後端工程師',
          department: '技術部',
          location: '台北',
          jobType: '全職',
          description: '負責後端API開發，需熟悉Node.js和資料庫',
          isPublic: true,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          applicantCount: 1
        }
      ];
      this.saveJobs(defaultJobs);
    }

    if (!this.getApplicants().length) {
      const defaultApplicants: Applicant[] = [
        {
          id: '1',
          name: '張三',
          email: 'zhang@example.com',
          jobPostingId: '1',
          resumeFile: 'zhang_resume.pdf',
          uploadedAt: new Date('2024-01-16'),
          aiScore: 85,
          aiSummary: '具備React經驗，技術能力良好',
          status: 'reviewed',
          isSelected: false,
          emailSent: false
        },
        {
          id: '2',
          name: '李四',
          email: 'li@example.com',
          jobPostingId: '1',
          resumeFile: 'li_resume.pdf',
          uploadedAt: new Date('2024-01-17'),
          aiScore: 92,
          aiSummary: '豐富的前端開發經驗，熟悉各種框架',
          status: 'pending',
          isSelected: false,
          emailSent: false
        },
        {
          id: '3',
          name: '王五',
          email: 'wang@example.com',
          jobPostingId: '2',
          resumeFile: 'wang_resume.pdf',
          uploadedAt: new Date('2024-01-18'),
          aiScore: 78,
          aiSummary: '後端開發經驗豐富，熟悉Node.js',
          status: 'reviewed',
          isSelected: false,
          emailSent: false
        }
      ];
      this.saveApplicants(defaultApplicants);
    }

    if (!this.getTemplates().length) {
      const defaultTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: '感謝信 - 通用',
          purpose: '一般感謝信',
          subject: '感謝您的應徵 - {{jobTitle}}',
          content: `親愛的 {{applicantName}}，

感謝您對本公司 {{jobTitle}} 職位的關注與應徵。

我們已收到您的履歷，並會仔細審閱。如有進一步的面試安排，我們會盡快與您聯繫。

再次感謝您的應徵！

祝好
人資部`,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10')
        }
      ];
      this.saveTemplates(defaultTemplates);
    }
  }

  constructor() {
    this.initializeDefaultData();
  }

  // Generic storage methods
  private getFromStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.map(item => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        uploadedAt: item.uploadedAt ? new Date(item.uploadedAt) : undefined
      })) : [];
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return [];
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Job methods
  getJobs(): JobPosting[] {
    return this.getFromStorage<JobPosting>(this.STORAGE_KEYS.JOBS);
  }

  getJobById(id: string): JobPosting | null {
    const jobs = this.getJobs();
    return jobs.find(job => job.id === id) || null;
  }

  saveJobs(jobs: JobPosting[]): void {
    this.saveToStorage(this.STORAGE_KEYS.JOBS, jobs);
  }

  createJob(jobData: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt' | 'applicantCount'>): JobPosting {
    const jobs = this.getJobs();
    const newJob: JobPosting = {
      ...jobData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      applicantCount: 0
    };
    jobs.push(newJob);
    this.saveJobs(jobs);
    return newJob;
  }

  updateJob(id: string, jobData: Partial<JobPosting>): JobPosting | null {
    const jobs = this.getJobs();
    const index = jobs.findIndex(job => job.id === id);
    if (index === -1) return null;

    jobs[index] = {
      ...jobs[index],
      ...jobData,
      updatedAt: new Date()
    };
    this.saveJobs(jobs);
    return jobs[index];
  }

  deleteJob(id: string): boolean {
    const jobs = this.getJobs();
    const filteredJobs = jobs.filter(job => job.id !== id);
    if (filteredJobs.length === jobs.length) return false;

    this.saveJobs(filteredJobs);
    
    // Also delete related applicants and filters
    const applicants = this.getApplicants().filter(app => app.jobPostingId !== id);
    this.saveApplicants(applicants);
    
    const filters = this.getFilters().filter(filter => filter.jobPostingId !== id);
    this.saveFilters(filters);
    
    return true;
  }

  // Applicant methods
  getApplicants(): Applicant[] {
    return this.getFromStorage<Applicant>(this.STORAGE_KEYS.APPLICANTS);
  }

  getApplicantsByJobId(jobId: string): Applicant[] {
    const applicants = this.getApplicants();
    return applicants.filter(app => app.jobPostingId === jobId);
  }

  saveApplicants(applicants: Applicant[]): void {
    this.saveToStorage(this.STORAGE_KEYS.APPLICANTS, applicants);
  }

  createApplicant(applicantData: Omit<Applicant, 'id' | 'uploadedAt'>): Applicant {
    const applicants = this.getApplicants();
    const newApplicant: Applicant = {
      ...applicantData,
      id: this.generateId(),
      uploadedAt: new Date()
    };
    applicants.push(newApplicant);
    this.saveApplicants(applicants);

    // Update job applicant count
    this.updateJobApplicantCount(applicantData.jobPostingId);

    return newApplicant;
  }

  updateApplicant(id: string, applicantData: Partial<Applicant>): Applicant | null {
    const applicants = this.getApplicants();
    const index = applicants.findIndex(app => app.id === id);
    if (index === -1) return null;

    applicants[index] = { ...applicants[index], ...applicantData };
    this.saveApplicants(applicants);
    return applicants[index];
  }

  private updateJobApplicantCount(jobId: string): void {
    const applicantCount = this.getApplicantsByJobId(jobId).length;
    this.updateJob(jobId, { applicantCount });
  }

  // Filter methods
  getFilters(): FilterCriteria[] {
    return this.getFromStorage<FilterCriteria>(this.STORAGE_KEYS.FILTERS);
  }

  getFilterByJobId(jobId: string): FilterCriteria | null {
    const filters = this.getFilters();
    return filters.find(filter => filter.jobPostingId === jobId) || null;
  }

  saveFilters(filters: FilterCriteria[]): void {
    this.saveToStorage(this.STORAGE_KEYS.FILTERS, filters);
  }

  saveFilter(filterData: Omit<FilterCriteria, 'id'>): FilterCriteria {
    const filters = this.getFilters();
    const existingIndex = filters.findIndex(filter => filter.jobPostingId === filterData.jobPostingId);
    
    if (existingIndex !== -1) {
      // Update existing filter
      filters[existingIndex] = { ...filters[existingIndex], ...filterData };
      this.saveFilters(filters);
      return filters[existingIndex];
    } else {
      // Create new filter
      const newFilter: FilterCriteria = {
        ...filterData,
        id: this.generateId()
      };
      filters.push(newFilter);
      this.saveFilters(filters);
      return newFilter;
    }
  }

  // Template methods
  getTemplates(): EmailTemplate[] {
    return this.getFromStorage<EmailTemplate>(this.STORAGE_KEYS.TEMPLATES);
  }

  getTemplateById(id: string): EmailTemplate | null {
    const templates = this.getTemplates();
    return templates.find(template => template.id === id) || null;
  }

  saveTemplates(templates: EmailTemplate[]): void {
    this.saveToStorage(this.STORAGE_KEYS.TEMPLATES, templates);
  }

  createTemplate(templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): EmailTemplate {
    const templates = this.getTemplates();
    const newTemplate: EmailTemplate = {
      ...templateData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    templates.push(newTemplate);
    this.saveTemplates(templates);
    return newTemplate;
  }

  updateTemplate(id: string, templateData: Partial<EmailTemplate>): EmailTemplate | null {
    const templates = this.getTemplates();
    const index = templates.findIndex(template => template.id === id);
    if (index === -1) return null;

    templates[index] = {
      ...templates[index],
      ...templateData,
      updatedAt: new Date()
    };
    this.saveTemplates(templates);
    return templates[index];
  }

  deleteTemplate(id: string): boolean {
    const templates = this.getTemplates();
    const filteredTemplates = templates.filter(template => template.id !== id);
    if (filteredTemplates.length === templates.length) return false;

    this.saveTemplates(filteredTemplates);
    return true;
  }

  // Utility methods
  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.initializeDefaultData();
  }

  exportData(): string {
    const data = {
      jobs: this.getJobs(),
      applicants: this.getApplicants(),
      filters: this.getFilters(),
      templates: this.getTemplates(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.jobs) this.saveJobs(data.jobs);
      if (data.applicants) this.saveApplicants(data.applicants);
      if (data.filters) this.saveFilters(data.filters);
      if (data.templates) this.saveTemplates(data.templates);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();