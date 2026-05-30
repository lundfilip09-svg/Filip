CREATE TABLE IF NOT EXISTS ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages" ON ai_chat_history
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX ai_chat_history_user_created ON ai_chat_history(user_id, created_at DESC);
