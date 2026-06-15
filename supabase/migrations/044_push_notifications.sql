-- 044_push_notifications.sql
-- Web Push-varsler: lagrer push-abonnement per enhet + planlagte varsler som
-- sendes på riktig tidspunkt (hviletimer + gjøremål-påminnelser).
-- Bakgrunn: iOS dreper service worker-en når PWA-en er i bakgrunnen, så
-- setTimeout i sw.js fyrer aldri. Ekte Web Push (VAPID) er eneste pålitelige
-- måte å levere varsel til telefonen mens du er i andre apper.
-- Idempotent: trygg å kjøre flere ganger.

-- ─── 1. Push-abonnement (én rad per enhet/nettleser) ─────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text UNIQUE NOT NULL,   -- unik push-endepunkt-URL fra nettleseren
  p256dh      text NOT NULL,          -- klientens offentlige nøkkel
  auth        text NOT NULL,          -- klientens auth-secret
  user_agent  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ─── 2. Planlagte varsler (hviletimer + påminnelser) ─────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  kind          text NOT NULL,          -- 'rest' | 'todo'
  title         text NOT NULL,
  body          text,
  tag           text,                   -- collapse-tag (f.eks. 'rest-timer')
  url           text,                   -- side å åpne ved klikk
  fire_at       timestamptz NOT NULL,
  todo_id       uuid,                   -- kobling til todos (for påminnelser)
  qstash_msg_id text,                   -- QStash-melding-ID (for kansellering)
  sent          boolean DEFAULT false,
  cancelled     boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sched_notif_due_idx
  ON scheduled_notifications (fire_at)
  WHERE sent = false AND cancelled = false;

-- ─── 3. remind_at på todos ───────────────────────────────────────────────────
ALTER TABLE todos ADD COLUMN IF NOT EXISTS remind_at timestamptz;

-- ─── 4. RLS — samme mønster som injury_pain (003 + 031) ──────────────────────
ALTER TABLE push_subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_full_access" ON push_subscriptions;
CREATE POLICY "authenticated_full_access" ON push_subscriptions
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated_full_access" ON scheduled_notifications;
CREATE POLICY "authenticated_full_access" ON scheduled_notifications
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

REVOKE ALL ON push_subscriptions      FROM anon;
REVOKE ALL ON scheduled_notifications FROM anon;
