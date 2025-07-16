import { supabase } from '../lib/supabase';
import { JobPosting, Applicant, EmailTemplate } from '../types';

class SupabaseService {
  // Test connection on first use
  private async testConnection() {
    try {
      const { error } = await supabase.from('jobs').select('count').limit(1);
      if (error) {
        console.error('Supabase connection failed:', error);
        return false;
      }
      console.log('Supabase connection successful');
      return true;
    } catch (err) {
      console.error('Supabase connection error:', err);
      return false;
    }
  }
  // Job Management
  async getJobs(): Promise<JobPosting[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(job => ({
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        jobType: job.job_type,
        description: job.description,
        attachments: job.attachments || [],
        isPublic: job.is_public,
        createdAt: new Date(job.created_at),
        updatedAt: new Date(job.updated_at),
        applicantCount: 0 // Will be calculated separately
      }));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  }

  async getJobById(id: string): Promise<JobPosting | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Get applicant count
      const { count } = await supabase
        .from('applicants')
        .select('*', { count: 'exact', head: true })
        .eq('job_posting_id', id);

      return {
        id: data.id,
        title: data.title,
        department: data.department,
        location: data.location,
        jobType: data.job_type,
        description: data.description,
        attachments: data.attachments || [],
        isPublic: data.is_public,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        applicantCount: count || 0
      };
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  }

  async createJob(jobData: Partial<JobPosting>): Promise<JobPosting> {
    try {
      console.log('Creating job with data:', jobData);
      
      const insertData = {
        title: jobData.title!,
        department: jobData.department!,
        location: jobData.location!,
        job_type: jobData.jobType || 'fullTime',
        description: jobData.description!,
        attachments: jobData.attachments || [],
        is_public: jobData.isPublic ?? true
      };
      
      console.log('Insert data:', insertData);
      
      const { data, error } = await supabase
        .from('jobs')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return {
        id: data.id,
        title: data.title,
        department: data.department,
        location: data.location,
        jobType: data.job_type,
        description: data.description,
        attachments: data.attachments || [],
        isPublic: data.is_public,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        applicantCount: 0
      };
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async updateJob(id: string, jobData: Partial<JobPosting>): Promise<JobPosting | null> {
    try {
      const updateData: any = {};
      if (jobData.title) updateData.title = jobData.title;
      if (jobData.department) updateData.department = jobData.department;
      if (jobData.location) updateData.location = jobData.location;
      if (jobData.jobType) updateData.job_type = jobData.jobType;
      if (jobData.description) updateData.description = jobData.description;
      if (jobData.attachments !== undefined) updateData.attachments = jobData.attachments;
      if (jobData.isPublic !== undefined) updateData.is_public = jobData.isPublic;

      const { data, error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        department: data.department,
        location: data.location,
        jobType: data.job_type,
        description: data.description,
        attachments: data.attachments || [],
        isPublic: data.is_public,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        applicantCount: 0
      };
    } catch (error) {
      console.error('Error updating job:', error);
      return null;
    }
  }

  async deleteJob(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      return false;
    }
  }

  // Applicant Management
  async getApplicantsByJobId(jobId: string): Promise<Applicant[]> {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('job_posting_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(applicant => ({
        id: applicant.id,
        name: applicant.name,
        email: applicant.email,
        jobPostingId: applicant.job_posting_id,
        resumeFile: applicant.resume_file_url || '',
        uploadedAt: new Date(applicant.created_at),
        aiScore: applicant.ai_score,
        aiSummary: applicant.ai_summary,
        status: applicant.status as 'pending' | 'reviewed' | 'selected' | 'rejected',
        isSelected: applicant.is_selected,
        emailSent: applicant.email_sent,
        emailSentAt: applicant.email_sent_at ? new Date(applicant.email_sent_at) : undefined,
        lastEmailType: applicant.last_email_type as 'interview' | 'rejection' | undefined,
        lastEmailDate: applicant.last_email_date ? new Date(applicant.last_email_date) : undefined
      }));
    } catch (error) {
      console.error('Error fetching applicants:', error);
      return [];
    }
  }

  async getApplicants(): Promise<Applicant[]> {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(applicant => ({
        id: applicant.id,
        name: applicant.name,
        email: applicant.email,
        jobPostingId: applicant.job_posting_id,
        resumeFile: applicant.resume_file_url || '',
        uploadedAt: new Date(applicant.created_at),
        aiScore: applicant.ai_score,
        aiSummary: applicant.ai_summary,
        status: applicant.status as 'pending' | 'reviewed' | 'selected' | 'rejected',
        isSelected: applicant.is_selected,
        emailSent: applicant.email_sent,
        emailSentAt: applicant.email_sent_at ? new Date(applicant.email_sent_at) : undefined,
        lastEmailType: applicant.last_email_type as 'interview' | 'rejection' | undefined,
        lastEmailDate: applicant.last_email_date ? new Date(applicant.last_email_date) : undefined
      }));
    } catch (error) {
      console.error('Error fetching applicants:', error);
      return [];
    }
  }

  async createApplicant(applicantData: Partial<Applicant>): Promise<Applicant> {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .insert({
          job_posting_id: applicantData.jobPostingId!,
          name: applicantData.name!,
          email: applicantData.email!,
          resume_file_url: applicantData.resumeFile,
          ai_score: applicantData.aiScore,
          ai_summary: applicantData.aiSummary,
          status: applicantData.status || 'pending',
          is_selected: applicantData.isSelected || false,
          email_sent: applicantData.emailSent || false
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        jobPostingId: data.job_posting_id,
        resumeFile: data.resume_file_url || '',
        uploadedAt: new Date(data.created_at),
        aiScore: data.ai_score,
        aiSummary: data.ai_summary,
        status: data.status as 'pending' | 'reviewed' | 'selected' | 'rejected',
        isSelected: data.is_selected,
        emailSent: data.email_sent,
        emailSentAt: data.email_sent_at ? new Date(data.email_sent_at) : undefined,
        lastEmailType: data.last_email_type as 'interview' | 'rejection' | undefined,
        lastEmailDate: data.last_email_date ? new Date(data.last_email_date) : undefined
      };
    } catch (error) {
      console.error('Error creating applicant:', error);
      throw error;
    }
  }

  async updateApplicant(id: string, applicantData: Partial<Applicant>): Promise<Applicant | null> {
    try {
      const updateData: any = {};
      if (applicantData.name) updateData.name = applicantData.name;
      if (applicantData.email) updateData.email = applicantData.email;
      if (applicantData.resumeFile !== undefined) updateData.resume_file_url = applicantData.resumeFile;
      if (applicantData.aiScore !== undefined) updateData.ai_score = applicantData.aiScore;
      if (applicantData.aiSummary !== undefined) updateData.ai_summary = applicantData.aiSummary;
      if (applicantData.status) updateData.status = applicantData.status;
      if (applicantData.isSelected !== undefined) updateData.is_selected = applicantData.isSelected;
      if (applicantData.emailSent !== undefined) updateData.email_sent = applicantData.emailSent;
      if (applicantData.emailSentAt) updateData.email_sent_at = applicantData.emailSentAt.toISOString();
      if (applicantData.lastEmailType) updateData.last_email_type = applicantData.lastEmailType;
      if (applicantData.lastEmailDate) updateData.last_email_date = applicantData.lastEmailDate.toISOString();

      const { data, error } = await supabase
        .from('applicants')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        jobPostingId: data.job_posting_id,
        resumeFile: data.resume_file_url || '',
        uploadedAt: new Date(data.created_at),
        aiScore: data.ai_score,
        aiSummary: data.ai_summary,
        status: data.status as 'pending' | 'reviewed' | 'selected' | 'rejected',
        isSelected: data.is_selected,
        emailSent: data.email_sent,
        emailSentAt: data.email_sent_at ? new Date(data.email_sent_at) : undefined,
        lastEmailType: data.last_email_type as 'interview' | 'rejection' | undefined,
        lastEmailDate: data.last_email_date ? new Date(data.last_email_date) : undefined
      };
    } catch (error) {
      console.error('Error updating applicant:', error);
      return null;
    }
  }

  // Email Template Management
  async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(template => ({
        id: template.id,
        name: template.name,
        purpose: template.purpose,
        subject: template.subject,
        content: template.content,
        createdAt: new Date(template.created_at),
        updatedAt: new Date(template.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  async createTemplate(templateData: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: templateData.name!,
          purpose: templateData.purpose || 'general',
          subject: templateData.subject!,
          content: templateData.content!
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        purpose: data.purpose,
        subject: data.subject,
        content: data.content,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, templateData: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    try {
      const updateData: any = {};
      if (templateData.name) updateData.name = templateData.name;
      if (templateData.purpose) updateData.purpose = templateData.purpose;
      if (templateData.subject) updateData.subject = templateData.subject;
      if (templateData.content) updateData.content = templateData.content;

      const { data, error } = await supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        purpose: data.purpose,
        subject: data.subject,
        content: data.content,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error updating template:', error);
      return null;
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }
}

export const supabaseService = new SupabaseService();