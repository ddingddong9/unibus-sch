import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import type {
  ApiResponse,
  User,
  Notice,
  BusRoute,
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

  // ============ ROUTE ENDPOINTS ============

  async getRoutes(): Promise<BusRoute[]> {
    const response = await this.request<ApiResponse<BusRoute[]>>('/routes');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch routes');
  }

  async getRoute(id: string): Promise<BusRoute> {
    const response = await this.request<ApiResponse<BusRoute>>(`/routes/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch route');
  }

  async createRoute(route: Partial<BusRoute>): Promise<BusRoute> {
    const response = await this.request<ApiResponse<BusRoute>>('/routes', {
      method: 'POST',
      body: JSON.stringify(route),
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create route');
  }

  async updateRoute(id: string, updates: Partial<BusRoute>): Promise<BusRoute> {
    const response = await this.request<ApiResponse<BusRoute>>(`/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update route');
  }

  async deleteRoute(id: string): Promise<void> {
    const response = await this.request<ApiResponse>(`/routes/${id}`, {
      method: 'DELETE',
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete route');
    }
  }

  // ============ BUS ENDPOINTS ============

  async getBuses(): Promise<any[]> {
    const response = await this.request<ApiResponse<any[]>>('/buses');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch buses');
  }

  async getBus(id: string): Promise<any> {
    const response = await this.request<ApiResponse<any>>(`/buses/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch bus');
  }

  async createBus(bus: { name: string; type: string; capacity?: number; licensePlate?: string; routeId?: string }): Promise<any> {
    const response = await this.request<ApiResponse<any>>('/buses', {
      method: 'POST',
      body: JSON.stringify(bus),
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to create bus');
  }

  async updateBus(id: string, updates: Partial<{ name: string; capacity: number; licensePlate: string; status: string; currentRouteId: string }>): Promise<any> {
    const response = await this.request<ApiResponse<any>>(`/buses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to update bus');
  }

  async getBusLocations(): Promise<Array<{ busId: string; lat: number; lng: number; speed: number; heading: number; timestamp: string }>> {
    const response = await this.request<ApiResponse<any[]>>('/buses/locations/latest');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to fetch bus locations');
  }

  async updateBusLocation(busId: string, location: { lat: number; lng: number; speed?: number; heading?: number }): Promise<void> {
    const response = await this.request<ApiResponse>(`/buses/${busId}/location`, {
      method: 'POST',
      body: JSON.stringify(location),
    });
    if (!response.success) {
      throw new Error(response.error || 'Failed to update bus location');
    }
  }

  // ============ USER MANAGEMENT ENDPOINTS (Admin) ============

  async getUsers(): Promise<any[]> {
    const response = await this.request<ApiResponse<any[]>>('/users');
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to fetch users');
  }

  async updateUserRole(userId: string, role: 'user' | 'admin' | 'driver'): Promise<void> {
    const response = await this.request<ApiResponse>(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    if (!response.success) throw new Error(response.error || 'Failed to update role');
  }

  // ============ DRIVER ENDPOINTS ============

  async getDriverBuses(): Promise<any[]> {
    const response = await this.request<ApiResponse<any[]>>('/driver/buses');
    if (response.success && response.data) return response.data;
    throw new Error(response.error || 'Failed to fetch buses');
  }

  async driverStart(busId: string): Promise<void> {
    const response = await this.request<ApiResponse>('/driver/start', {
      method: 'POST',
      body: JSON.stringify({ busId }),
    });
    if (!response.success) throw new Error(response.error || 'Failed to start driving');
  }

  async driverSendLocation(lat: number, lng: number, speed: number, heading: number): Promise<void> {
    const response = await this.request<ApiResponse>('/driver/location', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, speed, heading }),
    });
    if (!response.success) throw new Error(response.error || 'Failed to send location');
  }

  async driverStop(): Promise<void> {
    const response = await this.request<ApiResponse>('/driver/stop', {
      method: 'POST',
    });
    if (!response.success) throw new Error(response.error || 'Failed to stop driving');
  }

  async getDriverStatus(): Promise<{ activeBus: any | null }> {
    const response = await this.request<ApiResponse<{ activeBus: any | null }>>('/driver/status');
    if (response.success && response.data) return response.data;
    return { activeBus: null };
  }

  // ============ CAMPUS ENDPOINTS ============

  async getCampusRoutePath(): Promise<{ path: [number, number][]; stops: any[] }> {
    const res = await fetch('/api/campus-route');
    const data = await res.json();
    if (data.success && data.data) return data.data;
    throw new Error(data.error || 'Failed to fetch campus route path');
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