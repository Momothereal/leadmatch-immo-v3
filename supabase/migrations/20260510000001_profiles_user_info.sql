-- ============================================================
-- Profiles : ajout infos utilisateur (nom, prénom, agence, téléphone)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name  text,
  ADD COLUMN IF NOT EXISTS last_name   text,
  ADD COLUMN IF NOT EXISTS agency_name text,
  ADD COLUMN IF NOT EXISTS phone       text;

-- Autoriser l'INSERT pour que l'utilisateur puisse créer son profil
-- (en complément du trigger on_auth_user_created)
CREATE POLICY IF NOT EXISTS "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
