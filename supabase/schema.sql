-- EcoTrace v3.0 — Supabase Schema
-- Run this in Supabase SQL Editor

-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  request_id      UUID UNIQUE NOT NULL,
  content_type    TEXT CHECK (content_type IN ('image', 'text', 'video')) NOT NULL,
  final_verdict   TEXT CHECK (final_verdict IN ('ai_generated', 'real')),
  ai_likelihood   FLOAT,
  agreement_level TEXT CHECK (agreement_level IN ('high', 'medium', 'low')),
  scam_risk_score FLOAT,
  behavioral_score FLOAT,
  model_outputs   JSONB,
  evidence        JSONB,
  source          TEXT CHECK (source IN ('web', 'extension')) DEFAULT 'web',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own analyses
CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
  ON analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_request_id ON analyses(request_id);
