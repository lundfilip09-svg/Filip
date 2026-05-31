CREATE TABLE IF NOT EXISTS training_plan_weekly (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_monday  date NOT NULL,
  day_index    integer NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
  session_text text NOT NULL DEFAULT '',
  notes        text NOT NULL DEFAULT '',
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, week_monday, day_index)
);

ALTER TABLE training_plan_weekly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weekly training plan" ON training_plan_weekly
  FOR ALL USING (auth.uid() = user_id);
