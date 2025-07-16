-- HR Management System Database Schema for Supabase
-- This file contains the complete database structure for the HR system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    job_type VARCHAR(50) NOT NULL DEFAULT 'fullTime',
    description TEXT NOT NULL,
    attachments TEXT[], -- Array of file URLs
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applicants table
CREATE TABLE applicants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_posting_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    resume_file_url TEXT,
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_summary TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'selected', 'rejected')),
    is_selected BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    last_email_type VARCHAR(20) CHECK (last_email_type IN ('interview', 'rejection')),
    last_email_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email templates table
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'general' CHECK (purpose IN ('general', 'interview', 'offer', 'rejection')),
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_applicants_job_posting_id ON applicants(job_posting_id);
CREATE INDEX idx_applicants_status ON applicants(status);
CREATE INDEX idx_applicants_created_at ON applicants(created_at);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_department ON jobs(department);
CREATE INDEX idx_jobs_is_public ON jobs(is_public);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applicants_updated_at BEFORE UPDATE ON applicants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO jobs (title, department, location, job_type, description, is_public) VALUES
('Frontend Developer', 'Engineering', 'Taipei', 'fullTime', 'We are looking for a skilled Frontend Developer to join our team. You will be responsible for building user interfaces and ensuring great user experience.', true),
('HR Manager', 'Human Resources', 'Taipei', 'fullTime', 'Seeking an experienced HR Manager to oversee our human resources operations including recruitment, employee relations, and policy development.', true),
('Digital Marketing Specialist', 'Marketing', 'Remote', 'partTime', 'Join our marketing team to develop and execute digital marketing campaigns across various channels.', true);

INSERT INTO email_templates (name, purpose, subject, content) VALUES
('Standard Interview Invitation', 'interview', 'Interview Invitation - {{jobTitle}}', 'Dear {{applicantName}},

Thank you for your interest in the {{jobTitle}} position at our company.

We would like to invite you for an interview. Please reply with your availability.

Best regards,
HR Team'),
('Standard Rejection Letter', 'rejection', 'Application Status - {{jobTitle}}', 'Dear {{applicantName}},

Thank you for your interest in the {{jobTitle}} position.

After careful consideration, we have decided to move forward with other candidates. We encourage you to apply for future positions.

Best regards,
HR Team');

-- Row Level Security (RLS) policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on jobs" ON jobs FOR ALL USING (true);
CREATE POLICY "Allow all operations on applicants" ON applicants FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_templates" ON email_templates FOR ALL USING (true);