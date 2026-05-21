"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  pickRandomSlot,
  setPasswordChallengeSlot,
  clearPasswordChallengeSlot,
} from "@/lib/challenge";
import {
  createPasscodeSlot,
  encryptAuthSecret,
  generateInternalAuthPassword,
  loginEmailForUser,
  normalizeUsername,
  passwordsMustDiffer,
} from "@/lib/authSecrets";
import {
  createFullProfile,
  fetchPasswordSlotForLogin,
  isUsernameAvailable,
} from "@/lib/profileAuth";
import { formatAuthError } from "@/lib/authErrors";
import { decryptAuthSecret } from "@/lib/authSecrets";

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [passcode1, setPasscode1] = useState("");
  const [passcode2, setPasscode2] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [pwSlot, setPwSlot] = useState<1 | 2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (mode === "login") {
      const slot = pickRandomSlot();
      setPwSlot(slot);
      setPasswordChallengeSlot(slot);
    } else {
      setPwSlot(null);
      clearPasswordChallengeSlot();
    }
  }, [mode]);

  const handleRegister = async () => {
    if (!passwordsMustDiffer(password1, password2)) {
      setError("Hai mật khẩu truy cập phải khác nhau.");
      return;
    }
    if (!passwordsMustDiffer(passcode1, passcode2)) {
      setError("Hai passcode phải khác nhau.");
      return;
    }
    if (passcode1.length < 6 || passcode2.length < 6) {
      setError("Mỗi passcode tối thiểu 6 ký tự.");
      return;
    }
    if (password1.length < 8) {
      setError("Mật khẩu truy cập tối thiểu 8 ký tự.");
      return;
    }

    const uname = normalizeUsername(username);
    if (uname.length < 3) {
      setError("Username tối thiểu 3 ký tự.");
      return;
    }

    const available = await isUsernameAvailable(uname);
    if (!available) {
      setError("Username này đã được dùng. Chọn username khác.");
      return;
    }

    const loginEmail = loginEmailForUser(uname, email);
    const internalPw = generateInternalAuthPassword();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: loginEmail,
      password: internalPw,
    });
    if (signUpError) throw signUpError;

    const userId = signUpData.user?.id;
    if (!userId) {
      throw new Error(
        "Supabase không trả về user sau đăng ký. Tắt «Confirm email» trong Authentication hoặc xác nhận email rồi thử đăng nhập."
      );
    }

    const pc1 = await createPasscodeSlot(passcode1);
    const pc2 = await createPasscodeSlot(passcode2);
    const pw1 = await encryptAuthSecret(internalPw, password1);
    const pw2 = await encryptAuthSecret(internalPw, password2);

    await createFullProfile({
      id: userId,
      username: uname,
      login_email: loginEmail,
      passcode1: {
        salt: pc1.salt,
        ciphertext: pc1.ciphertext,
        iv: pc1.iv,
      },
      passcode2: {
        salt: pc2.salt,
        ciphertext: pc2.ciphertext,
        iv: pc2.iv,
      },
      password1: pw1,
      password2: pw2,
    });

    await supabase.auth.signOut();

    const needsEmailConfirm = !signUpData.session;
    setMessage(
      needsEmailConfirm
        ? "Đã tạo tài khoản. Kiểm tra email để xác nhận (nếu Supabase bật Confirm email), sau đó đăng nhập bằng username và một trong hai mật khẩu truy cập."
        : "Đăng ký thành công. Đăng nhập bằng username và một trong hai mật khẩu truy cập (mỗi lần hệ thống chọn ngẫu nhiên một lớp)."
    );
    setMode("login");
    setPassword1("");
    setPassword2("");
    setPasscode1("");
    setPasscode2("");
  };

  const handleLogin = async () => {
    const uname = normalizeUsername(username);
    if (!pwSlot) {
      setError("Thiếu thử thách bảo mật. Tải lại trang.");
      return;
    }

    const bundle = await fetchPasswordSlotForLogin(uname, pwSlot);
    if (!bundle) {
      setError(
        "Username không tồn tại hoặc tài khoản chưa nâng cấp bảo mật kép. Chạy schema-auth-upgrade.sql trên Supabase."
      );
      return;
    }

    const internalPw = await decryptAuthSecret(
      loginPassword,
      bundle.salt,
      bundle.ciphertext,
      bundle.iv
    );
    if (!internalPw) {
      setError(
        "Mật khẩu không đúng với lớp được yêu cầu lần này. Thử mật khẩu còn lại hoặc tải lại trang để đổi lớp."
      );
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: bundle.login_email,
      password: internalPw,
    });
    if (signInError) throw signInError;

    clearPasswordChallengeSlot();
    onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured()) {
      setError(
        "Chưa cấu hình Supabase. Sao chép .env.example thành .env.local và điền URL + anon key."
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (err) {
      setError(
        formatAuthError(err, mode === "register" ? "register" : "login")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-sm text-vault-muted">Username</label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-field"
          placeholder="ten_dang_nhap"
          autoComplete="username"
        />
      </div>

      {mode === "register" && (
        <div>
          <label className="mb-1 block text-sm text-vault-muted">
            Email (tùy chọn — để khôi phục / thông báo)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <p className="mt-1 text-xs text-vault-muted">
            Bỏ trống email → dùng <code className="text-vault-accent">username@example.net</code>
          </p>
        </div>
      )}

      {mode === "login" ? (
        <div>
          <label className="mb-1 block text-sm text-vault-muted">
            Mật khẩu truy cập
            {pwSlot && (
              <span className="ml-2 text-xs text-amber-400/90">
                (lớp {pwSlot} — dùng một trong hai mật khẩu đã đăng ký)
              </span>
            )}
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="mt-2 text-xs text-vault-accent hover:underline"
            onClick={() => {
              const slot = pickRandomSlot();
              setPwSlot(slot);
              setPasswordChallengeSlot(slot);
              setLoginPassword("");
              setError("");
            }}
          >
            Đổi thử thách lớp (thử mật khẩu kia)
          </button>
        </div>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-sm text-vault-muted">
              Mật khẩu truy cập 1
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password1}
              onChange={(e) => setPassword1(e.target.value)}
              className="input-field"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-vault-muted">
              Mật khẩu truy cập 2 (khác mật khẩu 1)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="input-field"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-vault-muted">
              Passcode két 1
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passcode1}
              onChange={(e) => setPasscode1(e.target.value)}
              className="input-field"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-vault-muted">
              Passcode két 2 (khác passcode 1)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={passcode2}
              onChange={(e) => setPasscode2(e.target.value)}
              className="input-field"
              autoComplete="off"
            />
          </div>
        </>
      )}

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          {message}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading
          ? "Đang xử lý..."
          : mode === "login"
            ? "Đăng nhập"
            : "Đăng ký"}
      </button>

      <p className="text-center text-sm text-vault-muted">
        {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setMessage("");
          }}
          className="text-vault-accent hover:underline"
        >
          {mode === "login" ? "Đăng ký" : "Đăng nhập"}
        </button>
      </p>
    </form>
  );
}
