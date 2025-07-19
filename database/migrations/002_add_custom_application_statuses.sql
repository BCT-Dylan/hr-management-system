-- Migration: Add custom application statuses system
-- This allows HR admins to customize applicant review statuses

-- Create application_statuses table
CREATE TABLE IF NOT EXISTS application_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#6c757d', -- Hex color code
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_application_statuses_active ON application_statuses(is_active);
CREATE INDEX IF NOT EXISTS idx_application_statuses_sort ON application_statuses(sort_order);

-- Insert default statuses (based on existing system)
INSERT INTO application_statuses (name, display_name, description, color, is_default, sort_order) VALUES
('pending', '待審核', '新提交的申請，等待初步審核', '#f39c12', true, 1),
('reviewed', '已審核', '已完成初步審核，等待進一步處理', '#17a2b8', true, 2),
('interviewing', '面試中', '已安排面試或正在進行面試流程', '#007bff', false, 3),
('selected', '錄取', '通過所有審核流程，已決定錄取', '#28a745', true, 4),
('rejected', '不錄取', '未通過審核或面試，決定不錄取', '#dc3545', true, 5),
('on_hold', '暫停處理', '暫時擱置，等待後續決定', '#6c757d', false, 6),
('withdrawn', '撤回申請', '應徵者主動撤回申請', '#6f42c1', false, 7);

-- Add foreign key constraint to applicants table
-- Note: This assumes the applicants table uses string status values
-- We'll need to handle the migration of existing data

-- Add a new status_id column to applicants table
ALTER TABLE applicants ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES application_statuses(id);

-- Create a function to migrate existing status data
CREATE OR REPLACE FUNCTION migrate_applicant_statuses()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Update applicants with corresponding status IDs based on existing status strings
    FOR rec IN 
        SELECT id, status FROM applicants WHERE status_id IS NULL
    LOOP
        UPDATE applicants 
        SET status_id = (
            SELECT id FROM application_statuses 
            WHERE name = rec.status 
            LIMIT 1
        )
        WHERE id = rec.id;
    END LOOP;
    
    -- Set default status for any remaining null values
    UPDATE applicants 
    SET status_id = (SELECT id FROM application_statuses WHERE name = 'pending' LIMIT 1)
    WHERE status_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_applicant_statuses();

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_application_statuses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_application_statuses_updated_at
    BEFORE UPDATE ON application_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_application_statuses_updated_at();

-- Create RLS policies if using Row Level Security
-- ALTER TABLE application_statuses ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE application_statuses IS 'Custom application review statuses that can be configured by HR admins';
COMMENT ON COLUMN application_statuses.name IS 'Internal name used in code (lowercase, underscore)';
COMMENT ON COLUMN application_statuses.display_name IS 'User-friendly name shown in UI';
COMMENT ON COLUMN application_statuses.color IS 'Hex color code for status display';
COMMENT ON COLUMN application_statuses.is_default IS 'Whether this is one of the original system statuses';
COMMENT ON COLUMN application_statuses.sort_order IS 'Order for displaying statuses in dropdowns';