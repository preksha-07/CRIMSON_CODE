CREATE TABLE IF NOT EXISTS capsules (
  id VARCHAR(64) PRIMARY KEY,
  ciphertext TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  max_reads INT DEFAULT NULL,
  remaining_reads INT DEFAULT NULL,
  delete_token_hash VARCHAR(128) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capsules_expires_at ON capsules(expires_at);