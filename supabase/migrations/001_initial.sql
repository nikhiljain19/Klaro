CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NULL,
    file_url text NOT NULL,
    file_path text NULL,
    file_name text NOT NULL,
    report_type text NOT NULL DEFAULT 'unknown',
    report_date date NULL,
    lab_name text NULL,
    doctor_name text NULL,
    uploaded_at timestamptz DEFAULT now(),
    extracted_values jsonb NOT NULL DEFAULT '{}'::jsonb,
    raw_text text NULL,
    extraction_confidence text NOT NULL DEFAULT 'low',
    confidence_reason text NULL,
    extraction_failed boolean NOT NULL DEFAULT false,
    user_notes text NULL,
    created_at timestamptz DEFAULT now()
);

-- Insert configuration for reports storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types) 
VALUES ('reports', 'reports', false, ARRAY['application/pdf']);
