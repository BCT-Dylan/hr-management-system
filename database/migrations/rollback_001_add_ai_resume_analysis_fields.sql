-- Rollback Migration: Remove AI Resume Analysis Fields
-- Created: 2025-07-18
-- Description: Rollback script for AI resume analysis fields migration

-- 1. Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_analysis_completed_timestamp ON applicants;
DROP FUNCTION IF EXISTS update_analysis_completed_timestamp();

-- 2. Drop indexes
DROP INDEX IF EXISTS idx_jobs_ai_analysis_enabled;
DROP INDEX IF EXISTS idx_applicants_analysis_completed;
DROP INDEX IF EXISTS idx_applicants_match_percentage;
DROP INDEX IF EXISTS idx_applicants_processing_status;

-- 3. Remove columns from applicants table
ALTER TABLE applicants 
DROP COLUMN IF EXISTS resume_content,
DROP COLUMN IF EXISTS resume_file_name,
DROP COLUMN IF EXISTS resume_file_size,
DROP COLUMN IF EXISTS extracted_info,
DROP COLUMN IF EXISTS match_percentage,
DROP COLUMN IF EXISTS analysis_completed,
DROP COLUMN IF EXISTS analysis_completed_at,
DROP COLUMN IF EXISTS ai_analysis_summary,
DROP COLUMN IF EXISTS processing_status;

-- 4. Remove columns from jobs table
ALTER TABLE jobs 
DROP COLUMN IF EXISTS job_description_detail,
DROP COLUMN IF EXISTS scoring_criteria,
DROP COLUMN IF EXISTS ai_analysis_enabled;