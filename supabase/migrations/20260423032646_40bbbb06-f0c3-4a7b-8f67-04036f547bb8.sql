CREATE UNIQUE INDEX IF NOT EXISTS leads_user_email_unique
ON public.leads (user_id, email)
WHERE email IS NOT NULL;