// Backend Type Definitions

export interface User {
  id: string;
  email: string;
  password?: string; // Should be hashed
  name: string;
  studentId?: string | null;
  role: 'user' | 'admin';
  provider?: 'local' | 'kakao';
  kakaoId?: string;
  profileImage?: string | null;
  createdAt: string;
}

export interface AuthToken {
  userId: string;
  email: string;
}

export interface KakaoLoginRequest {
  kakaoId: string;
  email?: string;
  name?: string;
  profileImage?: string;
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

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'route' | 'system';
  priority: 'low' | 'medium' | 'high';
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoticeRequest {
  title: string;
  content: string;
  category: 'general' | 'route' | 'system';
  priority: 'low' | 'medium' | 'high';
  imageUrls?: string[];
}

export interface BusRoute {
  id: string;
  name: string;
  type: 'campus' | 'commuter';
  stops: BusStop[];
  schedule: BusSchedule[];
  isActive: boolean;
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
  days: string[]; // ['mon', 'tue', 'wed', 'thu', 'fri']
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
