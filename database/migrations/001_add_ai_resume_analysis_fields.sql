-- Migration: Add AI Resume Analysis Fields
-- Created: 2025-07-18
-- Description: Add job description detail, scoring criteria, resume content, and AI analysis fields

-- 1. Add new columns to jobs table for AI analysis configuration
ALTER TABLE jobs 
ADD COLUMN job_description_detail TEXT,
ADD COLUMN scoring_criteria JSONB DEFAULT '{}',
ADD COLUMN ai_analysis_enabled BOOLEAN DEFAULT true;

-- 2. Add new columns to applicants table for resume content and AI analysis results
ALTER TABLE applicants 
ADD COLUMN resume_content TEXT,
ADD COLUMN resume_file_name VARCHAR(255),
ADD COLUMN resume_file_size INTEGER,
ADD COLUMN extracted_info JSONB DEFAULT '{}',
ADD COLUMN match_percentage INTEGER CHECK (match_percentage >= 0 AND match_percentage <= 100),
ADD COLUMN analysis_completed BOOLEAN DEFAULT false,
ADD COLUMN analysis_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ai_analysis_summary TEXT,
ADD COLUMN processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- 3. Create indexes for performance optimization
CREATE INDEX idx_jobs_ai_analysis_enabled ON jobs(ai_analysis_enabled);
CREATE INDEX idx_applicants_analysis_completed ON applicants(analysis_completed);
CREATE INDEX idx_applicants_match_percentage ON applicants(match_percentage DESC);
CREATE INDEX idx_applicants_processing_status ON applicants(processing_status);

-- 4. Add comments for documentation
COMMENT ON COLUMN jobs.job_description_detail IS 'Detailed job description for AI analysis';
COMMENT ON COLUMN jobs.scoring_criteria IS 'JSON object containing scoring weights and criteria for AI evaluation';
COMMENT ON COLUMN jobs.ai_analysis_enabled IS 'Whether AI analysis is enabled for this job posting';

COMMENT ON COLUMN applicants.resume_content IS 'Extracted text content from uploaded resume file';
COMMENT ON COLUMN applicants.resume_file_name IS 'Original filename of uploaded resume';
COMMENT ON COLUMN applicants.resume_file_size IS 'File size in bytes';
COMMENT ON COLUMN applicants.extracted_info IS 'JSON object containing extracted personal information from resume';
COMMENT ON COLUMN applicants.match_percentage IS 'AI calculated match percentage (0-100)';
COMMENT ON COLUMN applicants.analysis_completed IS 'Whether AI analysis has been completed';
COMMENT ON COLUMN applicants.analysis_completed_at IS 'Timestamp when AI analysis was completed';
COMMENT ON COLUMN applicants.ai_analysis_summary IS 'Summary of AI analysis results';
COMMENT ON COLUMN applicants.processing_status IS 'Current status of resume processing';

-- 5. Insert sample scoring criteria template for existing jobs
UPDATE jobs 
SET scoring_criteria = '{
  "technical_skills": {
    "weight": 30,
    "required_skills": [],
    "preferred_skills": []
  },
  "experience": {
    "weight": 25,
    "min_years": 0,
    "preferred_domains": []
  },
  "education": {
    "weight": 20,
    "min_degree": "bachelor",
    "preferred_majors": []
  },
  "languages": {
    "weight": 15,
    "required_languages": ["Chinese", "English"]
  },
  "soft_skills": {
    "weight": 10,
    "preferred_skills": ["communication", "teamwork", "problem-solving"]
  }
}'::jsonb
WHERE scoring_criteria = '{}' OR scoring_criteria IS NULL;

-- 6. Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_analysis_completed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.analysis_completed = true AND OLD.analysis_completed = false THEN
        NEW.analysis_completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-update analysis completion timestamp
CREATE TRIGGER trigger_update_analysis_completed_timestamp
    BEFORE UPDATE ON applicants
    FOR EACH ROW
    EXECUTE FUNCTION update_analysis_completed_timestamp();