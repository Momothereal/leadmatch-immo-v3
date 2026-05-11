-- Table de log pour éviter les doublons d'emails onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_email_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_day   text NOT NULL, -- '1', '5', '12', 'expire'
  sent_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, email_day)
);

-- RLS
ALTER TABLE public.onboarding_email_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='onboarding_email_log' AND policyname='Service role full access log'
  ) THEN
    CREATE POLICY "Service role full access log"
      ON public.onboarding_email_log FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;
