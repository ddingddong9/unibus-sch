import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import type { 
  ApiResponse, 
  User, 
  Notice, 
  LoginRequest, 
  SignupRequest, 
  KakaoUser 
} from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const API_BASE_URL = `${SUPABASE_URL}/functions/v1/make-server`;

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    };

    if (this.token) {
      headers['X-Auth-Token'] = this.token;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[API] Non-JSON response received:', {
          status: response.status,
          statusText: response.statusText,
          contentType
        });
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('[API] Request failed:', {
          endpoint,
          status: response.status,
          error: data.error || data.message
        });
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      console.log(`[API] Success:`, { endpoint, success: data.success });
      return data;
    } catch (error) {
      console.error('[API] Request failed:', {
        endpoint,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // ============ AUTH ENDPOINTS ============

  async signup(data: SignupRequest): Promise<{ user: User }> {
    const response = await this.request<ApiResponse<{ user: User }>>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Signup failed');
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<ApiResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.success && data.token) {
      this.setToken(data.token);
      return { token: data.token, user: data.user! };
    }
    throw new Error(data.error || 'Login failed');
  }

  async kakaoLogin(kakaoId: string, email?: string, name?: string, profileImage?: string): Promise<{ token: string; user: User }> {
    const data = await this.request<ApiResponse>('/auth/kakao', {
      method: 'POST',
      body: JSON.stringify({ kakaoId, email, name, profileImage }),
    });
    
    if (data.success && data.token) {
      this.setToken(data.token);
      return { token: data.token, user: data.user! };
    }
    throw new Error(data.error || 'Kakao login failed');
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.setToken(null);
      localStorage.removeItem('user');
    }
  }

  // ============ NOTICE ENDPOINTS ============

  async getNotices(): Promise<Notice[]> {
    const response = await this.request<ApiResponse<Notice[]>>('/notices');
    
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch notices');
  }

  async getNotice(id: string): Promise<Notice> {
    const response = await this.request<ApiResponse<Notice>>(`/notices/${id}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch notice');
  }

  async createNotice(notice: Partial<Notice>): Promise<Notice> {
    const response = await this.request<ApiResponse<Notice>>('/notices', {
      method: 'POST',
      body: JSON.stringify(notice),
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create notice');
  }

  async updateNotice(id: string, updates: Partial<Notice>): Promise<Notice> {
    const response = await this.request<ApiResponse<Notice>>(`/notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update notice');
  }

  async deleteNotice(id: string): Promise<void> {
    const response = await this.request<ApiResponse>(`/notices/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete notice');
    }
  }

  // ============ BUS ENDPOINTS ============

  async getBusLocations(): Promise<Array<{ busId: string; lat: number; lng: number; speed: number; heading: number; timestamp: string }>> {
    const response = await this.request<ApiResponse<any[]>>('/buses/locations/latest');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch bus locations');
  }

  async getBuses(): Promise<any[]> {
    const response = await this.request<ApiResponse<any[]>>('/buses');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch buses');
  }

  // ============ UTILITY ============

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const api = new ApiClient();