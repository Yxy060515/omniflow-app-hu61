// Shared API types — single source of truth for frontend ↔ backend contracts.
// Define ALL API request/response interfaces here and import them in both
// backend routes and frontend services.

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthUser {
  id: string;
  studentId: string;
  name: string;
}

export interface StudentLoginRequest {
  studentId: string;
  password: string;
}

export interface StudentSignupRequest {
  studentId: string;
  nickname?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResult {
  message: string;
  token: string;
  user: AuthUser;
}

export interface AuthOutcome {
  ok: boolean;
  message: string;
  data: AuthResult | null;
}

export interface AuthErrorBody {
  error?: { message?: string };
}
