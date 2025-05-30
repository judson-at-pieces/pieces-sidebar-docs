-- Create content sync logs table
CREATE TABLE IF NOT EXISTS content_sync_logs (
  id BIGSERIAL PRIMARY KEY,
  repository_owner TEXT NOT NULL,
  repository_name TEXT NOT NULL,
  files_synced INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('in_progress', 'completed', 'failed')),
  compilation_status TEXT CHECK (compilation_status IN ('pending', 'in_progress', 'completed', 'failed')),
  triggered_by TEXT NOT NULL DEFAULT 'manual',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create synced content table to store file contents
CREATE TABLE IF NOT EXISTS synced_content (
  id BIGSERIAL PRIMARY KEY,
  repository_owner TEXT NOT NULL,
  repository_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_content TEXT NOT NULL,
  sync_log_id BIGINT REFERENCES content_sync_logs(id) ON DELETE CASCADE,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(repository_owner, repository_name, file_path)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_sync_logs_repo ON content_sync_logs(repository_owner, repository_name);
CREATE INDEX IF NOT EXISTS idx_content_sync_logs_status ON content_sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_content_sync_logs_created_at ON content_sync_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_synced_content_repo ON synced_content(repository_owner, repository_name);
CREATE INDEX IF NOT EXISTS idx_synced_content_sync_log ON synced_content(sync_log_id);

-- Enable RLS
ALTER TABLE content_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_content ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can view sync logs" ON content_sync_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert sync logs" ON content_sync_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update sync logs" ON content_sync_logs FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Service role can access all content
CREATE POLICY "Service role can manage sync logs" ON content_sync_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage synced content" ON synced_content FOR ALL
TO service_role
USING (true)
WITH CHECK (true);