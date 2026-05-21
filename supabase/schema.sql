-- Chạy trong Supabase SQL Editor (schema đầy đủ cho cài mới)

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  login_email TEXT NOT NULL,
  salt TEXT NOT NULL,
  encrypted_verification TEXT NOT NULL,
  verification_iv TEXT NOT NULL,
  passcode_salt_2 TEXT NOT NULL,
  passcode_verification_2 TEXT NOT NULL,
  passcode_iv_2 TEXT NOT NULL,
  password_salt_1 TEXT NOT NULL,
  password_secret_1 TEXT NOT NULL,
  password_iv_1 TEXT NOT NULL,
  password_salt_2 TEXT NOT NULL,
  password_secret_2 TEXT NOT NULL,
  password_iv_2 TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (lower(username));

CREATE TABLE public.vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  encrypted_data JSONB NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX vault_user_id_idx ON public.vault(user_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Individual profiles access" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users vault ownership" ON public.vault
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vault_updated_at
  BEFORE UPDATE ON public.vault
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.resolve_username(p_username text)
RETURNS TABLE(login_email text, user_id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.login_email, p.id
  FROM public.profiles p
  WHERE lower(p.username) = lower(trim(p_username))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_password_slot(p_username text, p_slot int)
RETURNS TABLE(login_email text, salt text, ciphertext text, iv text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.login_email,
    CASE WHEN p_slot = 2 THEN p.password_salt_2 ELSE p.password_salt_1 END,
    CASE WHEN p_slot = 2 THEN p.password_secret_2 ELSE p.password_secret_1 END,
    CASE WHEN p_slot = 2 THEN p.password_iv_2 ELSE p.password_iv_1 END
  FROM public.profiles p
  WHERE lower(p.username) = lower(trim(p_username))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_username(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_password_slot(text, int) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_username_available(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(trim(p_username))
  );
$$;

CREATE OR REPLACE FUNCTION public.register_profile(
  p_user_id uuid,
  p_username text,
  p_login_email text,
  p_salt text,
  p_encrypted_verification text,
  p_verification_iv text,
  p_passcode_salt_2 text,
  p_passcode_verification_2 text,
  p_passcode_iv_2 text,
  p_password_salt_1 text,
  p_password_secret_1 text,
  p_password_iv_1 text,
  p_password_salt_2 text,
  p_password_secret_2 text,
  p_password_iv_2 text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uname text;
BEGIN
  v_uname := lower(trim(p_username));
  IF length(v_uname) < 3 THEN
    RAISE EXCEPTION 'username_too_short';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'invalid_user';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'profile_exists';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = v_uname) THEN
    RAISE EXCEPTION 'username_taken';
  END IF;
  INSERT INTO public.profiles (
    id, username, login_email,
    salt, encrypted_verification, verification_iv,
    passcode_salt_2, passcode_verification_2, passcode_iv_2,
    password_salt_1, password_secret_1, password_iv_1,
    password_salt_2, password_secret_2, password_iv_2
  ) VALUES (
    p_user_id, trim(p_username), p_login_email,
    p_salt, p_encrypted_verification, p_verification_iv,
    p_passcode_salt_2, p_passcode_verification_2, p_passcode_iv_2,
    p_password_salt_1, p_password_secret_1, p_password_iv_1,
    p_password_salt_2, p_password_secret_2, p_password_iv_2
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_profile(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text
) TO anon, authenticated;
