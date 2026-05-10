-- ============================================================
-- Teams : gestion d'équipe pour le plan Pro (max 5 sièges)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                    uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name                        text,
  max_seats                   int  NOT NULL DEFAULT 5,   -- 1 owner + 4 agents
  -- Limite anti-abus : max 20 opérations add/remove par mois calendaire
  monthly_actions             int  NOT NULL DEFAULT 0,
  monthly_actions_reset_at    timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email         text NOT NULL,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role          text NOT NULL DEFAULT 'agent' CHECK (role IN ('agent')),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  invite_token  text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  invited_at    timestamptz NOT NULL DEFAULT now(),
  joined_at     timestamptz,
  UNIQUE (team_id, email)
);

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Teams : owner lit/modifie sa propre équipe
CREATE POLICY "Owner manages own team"
  ON public.teams FOR ALL TO authenticated
  USING  (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Team members : owner voit tout ; membre voit sa propre ligne
CREATE POLICY "Owner sees all members"
  ON public.team_members FOR SELECT TO authenticated
  USING (
    (SELECT owner_id FROM public.teams WHERE id = team_id) = auth.uid()
    OR user_id = auth.uid()
  );

CREATE POLICY "Owner inserts members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT owner_id FROM public.teams WHERE id = team_id) = auth.uid()
  );

CREATE POLICY "Owner updates members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (
    (SELECT owner_id FROM public.teams WHERE id = team_id) = auth.uid()
  );

CREATE POLICY "Owner deletes members"
  ON public.team_members FOR DELETE TO authenticated
  USING (
    (SELECT owner_id FROM public.teams WHERE id = team_id) = auth.uid()
  );

-- Service role : accès complet (edge functions)
CREATE POLICY "Service role full access teams"
  ON public.teams FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access team_members"
  ON public.team_members FOR ALL TO service_role USING (true);
