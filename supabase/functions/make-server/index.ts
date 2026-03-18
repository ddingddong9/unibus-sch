// @ts-nocheck: Deno types are global in Supabase Edge Functions
/// <reference lib="deno.ns" />
/// <reference lib="deno.window" />

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 로컬 서버가 실행되는 동안 데이터를 유지할 변수
let notices = [
  {
    id: '1',
    title: '신학기 셔틀버스 운행 시간표 안내',
    content: '2026학년도 1학기 신학기 셔틀버스 운행 시간표가 확정되었습니다...',
    date: '2026-03-10',
    category: '운행정보',
    views: 125,
    isImportant: true
  },
  {
    id: '2',
    title: '시스템 점검 안내 (3월 20일)',
    content: '안정적인 서비스 제공을 위해 서버 점검이 진행될 예정입니다...',
    date: '2026-03-15',
    category: '공지사항',
    views: 42,
    isImportant: false
  },
  {
    id: '3',
    title: '카카오 로그인 오류 수정 완료',
    content: '일부 기기에서 발생하던 카카오 로그인 에러가 수정되었습니다.',
    date: '2026-03-16',
    category: '업데이트',
    views: 89,
    isImportant: false
  }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)

    // 회원가입 API
    if (url.pathname.endsWith('/auth/signup') && req.method === 'POST') {
      const body = await req.json()
      return new Response(JSON.stringify({
        success: true,
        data: { user: { id: 'user-' + Math.random().toString(36).substring(2, 7), email: body.email, role: 'user' } }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // 로그인 API
    if (url.pathname.endsWith('/auth/login') && req.method === 'POST') {
      const body = await req.json()
      const isAdmin = body.email === 'admin@unibus.com'
      return new Response(JSON.stringify({
        success: true,
        token: 'mock-token',
        user: { id: isAdmin ? 'admin-id' : 'user-id', email: body.email, role: isAdmin ? 'admin' : 'user' },
        data: { token: 'mock-token', user: { id: isAdmin ? 'admin-id' : 'user-id', email: body.email, role: isAdmin ? 'admin' : 'user' } }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // 공지사항 상세/삭제/수정 API
    if (url.pathname.match(/\/notices\/\w+$/)) {
      const id = url.pathname.split('/').pop()
      
      if (req.method === 'DELETE') {
        notices = notices.filter(n => n.id !== id)
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      
      if (req.method === 'PUT') {
        const body = await req.json()
        notices = notices.map(n => n.id === id ? { ...n, ...body } : n)
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (req.method === 'GET') {
        const notice = notices.find(n => n.id === id)
        return new Response(JSON.stringify({ success: true, data: notice }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // 공지사항 목록 및 생성 API
    if (url.pathname.endsWith('/notices')) {
      if (req.method === 'GET') {
        return new Response(JSON.stringify({ success: true, data: notices }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (req.method === 'POST') {
        const body = await req.json()
        const newNotice = {
          id: Math.random().toString(36).substring(2, 11),
          ...body,
          date: new Date().toISOString().split('T')[0],
          views: 0
        }
        notices = [newNotice, ...notices] // 최신순으로 추가
        return new Response(JSON.stringify({ success: true, data: newNotice }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404, headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }
})
