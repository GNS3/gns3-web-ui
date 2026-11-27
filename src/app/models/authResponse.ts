export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  username?: string;
}
