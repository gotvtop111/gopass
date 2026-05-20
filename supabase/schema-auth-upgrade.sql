-- Chạy SAU schema.sql (bổ sung username, 2 mật khẩu, 2 passcode)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS login_email TEXT,
  ADD COLUMN IF NOT EXISTS passcode_salt_2 TEXT,
  ADD COLUMN IF NOT EXISTS passcode_verification_2 TEXT,
  ADD COLUMN IF NOT EXISTS passcode_iv_2 TEXT,
  ADD COLUMN IF NOT EXISTS password_salt_1 TEXT,
  ADD COLUMN IF NOT EXISTS password_secret_1 TEXT,
  ADD COLUMN IF NOT EXISTS password_iv_1 TEXT,
  ADD COLUMN IF NOT EXISTS password_salt_2 TEXT,
  ADD COLUMN IF NOT EXISTS password_secret_2 TEXT,
  ADD COLUMN IF NOT EXISTS password_iv_2 TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
  ON public.profiles (lower(username));

-- Tra cứu username khi chưa đăng nhập (chỉ email + id)
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

-- Lấy blob mật khẩu truy cập theo slot (1 hoặc 2) để giải mã phía client
CREATE OR REPLACE FUNCTION public.get_password_slot(p_username text, p_slot int)
RETURNS TABLE(
  login_email text,
  salt text,
  ciphertext text,
  iv text
)
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
    AND (
      (p_slot = 1 AND p.password_salt_1 IS NOT NULL)
      OR (p_slot = 2 AND p.password_salt_2 IS NOT NULL)
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_username(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_password_slot(text, int) TO anon, authenticated;
