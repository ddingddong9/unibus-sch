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
    const CAMPUS_STOPS = [
      { id: 'rear-gate', name: '후문',   lat: 36.772760, lng: 126.933816 },
      { id: 'hyang3',    name: '향3',    lat: 36.768228, lng: 126.935383 },
      { id: 'hyang1',    name: '향1',    lat: 36.767905, lng: 126.932505 },
      { id: 'library',   name: '도서관', lat: 36.768856, lng: 126.931303 },
      { id: 'main-gate', name: '정문',   lat: 36.769014, lng: 126.927978 },
    ];

    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    const start = '126.933816,36.772760';
    const goal  = '126.927978,36.769014';
    const waypoints = '126.935383,36.768228|126.932505,36.767905|126.931303,36.768856';
    const url = `https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving?start=${start}&goal=${goal}&waypoints=${waypoints}&option=traoptimal&ncpKeyId=${clientId}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log('[Campus] Naver Directions code:', data.code);
      if (data.code === 0) {
        const path: [number, number][] = data.route?.traoptimal?.[0]?.path ?? [];
        if (path.length > 0) return { path, stops: CAMPUS_STOPS };
      }
    } catch (e) {
      console.warn('[Campus] Directions API failed:', e);
    }

    // fallback: OSRM 사전 계산 경로
    return {
      stops: CAMPUS_STOPS,
      path: [
        [126.933885,36.772808],[126.9341,36.772611],[126.934403,36.772124],[126.934623,36.771748],
        [126.93473,36.771505],[126.934782,36.7711],[126.934835,36.770855],[126.934849,36.770798],
        [126.934866,36.770733],[126.934925,36.770428],[126.93515,36.769767],[126.935767,36.768791],
        [126.935788,36.768697],[126.935722,36.76856],[126.935398,36.768219],[126.93459,36.76737],
        [126.934087,36.766843],[126.933883,36.766777],[126.933686,36.766747],[126.933497,36.76678],
        [126.933384,36.766878],[126.932893,36.767569],[126.932672,36.767775],[126.932472,36.767833],
        [126.932065,36.767952],[126.931835,36.768102],[126.931473,36.768521],[126.931346,36.768667],
        [126.931235,36.768825],[126.931195,36.768882],[126.931052,36.769086],[126.931026,36.769112],
        [126.930926,36.769208],[126.930712,36.769197],[126.93045,36.76913],[126.929205,36.768786],
        [126.929075,36.768715],[126.928584,36.768445],[126.928451,36.768372],[126.928156,36.768734],
        [126.927943,36.768996],
      ],
    };
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