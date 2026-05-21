/** Chuyển lỗi Supabase / Postgres sang thông báo tiếng Việt dễ hiểu */
export function formatAuthError(err: unknown, context: "register" | "login"): string {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);

  const lower = msg.toLowerCase();

  if (
    lower.includes("username_taken") ||
    lower.includes("duplicate key") ||
    lower.includes("profiles_username_lower_idx")
  ) {
    return "Username này đã được dùng. Chọn username khác.";
  }

  if (lower.includes("username_too_short")) {
    return "Username tối thiểu 3 ký tự.";
  }

  if (lower.includes("profile_exists") || lower.includes("invalid_user")) {
    return context === "register"
      ? "Tài khoản Auth đã tồn tại nhưng chưa hoàn tất hồ sơ. Liên hệ quản trị hoặc dùng email khác."
      : msg;
  }

  if (
    lower.includes("register_profile") ||
    lower.includes("could not find the function") ||
    lower.includes("column") && lower.includes("does not exist")
  ) {
    return "Cơ sở dữ liệu chưa nâng cấp. Chạy file supabase/schema-auth-upgrade.sql (và phần register_profile) trong Supabase SQL Editor.";
  }

  if (lower.includes("row-level security") || lower.includes("violates row-level")) {
    return context === "register"
      ? "Không ghi được hồ sơ (RLS). Chạy SQL nâng cấp có hàm register_profile trên Supabase, rồi thử đăng ký lại."
      : "Không có quyền truy cập dữ liệu. Đăng nhập lại.";
  }

  if (
    lower.includes("user already registered") ||
    lower.includes("already been registered") ||
    lower.includes("email address is already")
  ) {
    return "Email đăng nhập đã được dùng (username hoặc email trùng). Thử đăng nhập hoặc đổi username/email.";
  }

  if (lower.includes("invalid email") || lower.includes("unable to validate email")) {
    return "Email không hợp lệ. Nhập email thật hoặc đổi username (chỉ chữ, số, . _ -).";
  }

  if (lower.includes("signup is disabled") || lower.includes("signups not allowed")) {
    return "Supabase đang tắt đăng ký. Bật Sign-ups trong Authentication → Providers.";
  }

  if (lower.includes("password") && lower.includes("weak")) {
    return "Mật khẩu hệ thống không đạt yêu cầu Supabase. Thử lại hoặc báo lỗi cho quản trị.";
  }

  if (lower.includes("email not confirmed") || lower.includes("confirm your email")) {
    return "Email chưa được xác nhận. Kiểm tra hộp thư hoặc tắt «Confirm email» trong Supabase Authentication.";
  }

  if (context === "register" && (lower.includes("fetch") || lower.includes("network"))) {
    return `Không kết nối được Supabase: ${msg}`;
  }

  return msg || (context === "register" ? "Không thể đăng ký. Xem chi tiết ở trên." : "Đăng nhập thất bại.");
}
