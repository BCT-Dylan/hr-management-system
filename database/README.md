# Database Migrations

This directory contains database migration scripts for the HR Management System.

## Migration Files

### 001_add_ai_resume_analysis_fields.sql
**Purpose**: Add AI resume analysis functionality to the database
**Date**: 2025-07-18

**Changes:**
- Adds `job_description_detail`, `scoring_criteria`, and `ai_analysis_enabled` to `jobs` table
- Adds resume processing and AI analysis fields to `applicants` table
- Creates performance indexes on new fields
- Adds automatic timestamp trigger for analysis completion
- Includes sample scoring criteria template

**New Fields in `jobs` table:**
- `job_description_detail` (TEXT) - Detailed JD for AI analysis
- `scoring_criteria` (JSONB) - AI evaluation criteria and weights
- `ai_analysis_enabled` (BOOLEAN) - Enable/disable AI analysis per job

**New Fields in `applicants` table:**
- `resume_content` (TEXT) - Extracted resume text
- `resume_file_name` (VARCHAR) - Original filename
- `resume_file_size` (INTEGER) - File size in bytes
- `extracted_info` (JSONB) - AI extracted personal information
- `match_percentage` (INTEGER) - AI calculated match score (0-100)
- `analysis_completed` (BOOLEAN) - Analysis completion status
- `analysis_completed_at` (TIMESTAMP) - Analysis completion time
- `ai_analysis_summary` (TEXT) - AI analysis summary
- `processing_status` (VARCHAR) - Processing workflow status

## How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the migration script
4. Click "Run" to execute

### Option 2: Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push
```

### Option 3: Direct SQL Execution
```bash
# Using psql (if you have direct database access)
psql -h YOUR_DB_HOST -p 5432 -U postgres -d postgres -f database/migrations/001_add_ai_resume_analysis_fields.sql
```

## Rollback Instructions

If you need to rollback the changes:

```sql
-- Execute the rollback script
-- database/migrations/rollback_001_add_ai_resume_analysis_fields.sql
```

## Post-Migration Steps

After applying the migration:

1. **Update TypeScript Types**: Update your TypeScript interfaces to match the new schema
2. **Update Supabase Service**: Add methods for handling new fields
3. **Test Database Connection**: Verify all operations work correctly
4. **Update Frontend Forms**: Add UI elements for new fields

## Sample Data Structure

### Scoring Criteria JSON Structure:
```json
{
  "technical_skills": {
    "weight": 30,
    "required_skills": ["JavaScript", "React", "TypeScript"],
    "preferred_skills": ["Node.js", "GraphQL"]
  },
  "experience": {
    "weight": 25,
    "min_years": 2,
    "preferred_domains": ["fintech", "e-commerce"]
  },
  "education": {
    "weight": 20,
    "min_degree": "bachelor",
    "preferred_majors": ["Computer Science", "Information Technology"]
  },
  "languages": {
    "weight": 15,
    "required_languages": ["Chinese", "English"]
  },
  "soft_skills": {
    "weight": 10,
    "preferred_skills": ["communication", "teamwork", "problem-solving"]
  }
}
```

### Extracted Info JSON Structure:
```json
{
  "name": "張小明",
  "email": "zhang.xiaoming@email.com",
  "phone": "+886-912-345-678",
  "location": "台北市",
  "languages": [
    {"language": "Chinese", "level": "Native"},
    {"language": "English", "level": "Professional"}
  ],
  "education": [
    {
      "degree": "Bachelor",
      "major": "Computer Science",
      "school": "國立台灣大學",
      "graduation_year": 2020
    }
  ],
  "experience": [
    {
      "company": "科技公司",
      "position": "Frontend Developer",
      "duration": "2 years",
      "skills": ["React", "JavaScript", "CSS"]
    }
  ],
  "skills": ["JavaScript", "React", "TypeScript", "Node.js"]
}
```

## Notes

- All new JSONB fields default to `{}` to prevent null issues
- Indexes are created on frequently queried fields for performance
- Automatic timestamp trigger updates `analysis_completed_at` when analysis finishes
- Check constraints ensure data integrity (e.g., match_percentage 0-100)
- Comments are added to all new columns for documentation