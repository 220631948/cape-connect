export interface ImpersonationUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  tenant_id: string;
}

export interface ImpersonationActor {
  id: string;
  role: string;
  name: string | null;
  email: string | null;
}

export interface ImpersonationState {
  is_impersonating: boolean;
  current_user_id?: string | null;
  session_id?: string;
  started_at?: string;
  expires_at?: string;
  target_user?: ImpersonationUser;
  impersonator?: ImpersonationActor;
}

export interface StartImpersonationPayload {
  target_user_id: string;
  reason?: string;
  duration_seconds?: number;
  current_password: string;
  mfa_code?: string;
}
