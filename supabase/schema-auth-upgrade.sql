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

-- Đăng ký không cần session (tránh lỗi RLS khi bật xác nhận email)
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
