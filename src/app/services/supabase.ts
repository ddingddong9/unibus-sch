// [변경] Supabase Realtime 전용 클라이언트
// api.ts 의 fetch-based ApiClient와 별개로 WebSocket 채널 전용으로 사용
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  realtime: {
    params: { eventsPerSecond: 20 }, // 초당 최대 20 이벤트 처리
  },
});
