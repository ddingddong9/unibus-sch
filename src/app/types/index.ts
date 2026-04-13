// Frontend Type Definitions

export interface User {
  id: string;
  email: string;
  name: string;
  studentId?: string | null;
  role: 'user' | 'admin';
  provider?: 'local' | 'kakao';
  profileImage?: string | null;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'route' | 'system' | 'lost';
  priority: 'low' | 'medium' | 'high';
  isPinned: boolean;
  viewCount: number;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusRoute {
  id: string;
  name: string;
  type: 'campus' | 'commuter';
  description?: string;
  color?: string;
  region?: string;
  schedule?: string;   // 콤마로 구분된 시간 "06:30, 07:30"
  duration?: string;   // "50분"
  fare?: string;       // "₩3,500"
  stops: BusStop[];
  isActive: boolean;
  createdAt?: string;
  updatedAt: string;
}

export interface BusStop {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  order: number;
}

export interface BusSchedule {
  departureTime: string;
  arrivalTime: string;
  days: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  token?: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  studentId?: string;
}

export interface KakaoUser {
  kakaoId: string;
  email?: string;
  name?: string;
  profileImage?: string;
}
