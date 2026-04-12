-- Posts table for content calendar
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  caption TEXT,
  hashtags TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  platforms TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_org_id ON posts(org_id);
CREATE INDEX idx_posts_scheduled_at ON posts(scheduled_at);
CREATE INDEX idx_posts_status ON posts(status);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on posts" ON posts
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Add post_type column
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type TEXT;

-- Rename "Behind the Scenes" to "Behind Scenes"
UPDATE posts SET post_type = 'Behind Scenes' WHERE post_type = 'Behind the Scenes';
