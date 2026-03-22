// Kakao Login Service

declare global {
  interface Window {
    Kakao: any;
  }
}

export class KakaoLoginService {
  private static instance: KakaoLoginService;
  private initialized = false;
  private readonly APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY || 'YOUR_KAKAO_JAVASCRIPT_KEY';

  private constructor() {}

  static getInstance(): KakaoLoginService {
    if (!KakaoLoginService.instance) {
      KakaoLoginService.instance = new KakaoLoginService();
    }
    return KakaoLoginService.instance;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      // Load Kakao SDK
      const script = document.createElement('script');
      script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      script.async = true;
      
      script.onload = () => {
        if (window.Kakao) {
          if (!window.Kakao.isInitialized()) {
            window.Kakao.init(this.APP_KEY);
            console.log('Kakao SDK initialized:', window.Kakao.isInitialized());
          }
          this.initialized = true;
          resolve();
        } else {
          reject(new Error('Kakao SDK not loaded'));
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load Kakao SDK'));
      };

      document.head.appendChild(script);
    });
  }

  async login(): Promise<{
    kakaoId: string;
    email?: string;
    name?: string;
    profileImage?: string;
  }> {
    if (!this.initialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      window.Kakao.Auth.login({
        scope: 'profile_nickname,profile_image',
        success: (authObj: any) => {
          console.log('Kakao login success:', authObj);
          
          // Get user info
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: (response: any) => {
              console.log('Kakao user info:', response);
              
              const kakaoAccount = response.kakao_account || {};
              const profile = kakaoAccount.profile || {};
              
              resolve({
                kakaoId: String(response.id),
                email: kakaoAccount.email,
                name: profile.nickname,
                profileImage: profile.profile_image_url,
              });
            },
            fail: (error: any) => {
              console.error('Failed to get Kakao user info:', error);
              reject(new Error('Failed to get user info'));
            },
          });
        },
        fail: (error: any) => {
          console.error('Kakao login failed:', error);
          reject(new Error('Kakao login failed'));
        },
      });
    });
  }

  logout(): void {
    if (this.initialized && window.Kakao.Auth.getAccessToken()) {
      window.Kakao.Auth.logout(() => {
        console.log('Kakao logout success');
      });
    }
  }

  setAppKey(appKey: string): void {
    if (!this.initialized) {
      (this as any).APP_KEY = appKey;
    }
  }
}

export const kakaoService = KakaoLoginService.getInstance();
