CREATE TABLE IF NOT EXISTS weekly_plan (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day         integer NOT NULL CHECK (day >= 0 AND day <= 6),
  session_type text NOT NULL DEFAULT '',
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, day)
);

ALTER TABLE weekly_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weekly plan" ON weekly_plan
  FOR ALL USING (auth.uid() = user_id);
