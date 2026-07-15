// Seed initial data for SCH Shuttle App (관계형 DB 버전)

import { db } from "./db.tsx";
import * as bcrypt from "npm:bcryptjs";

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");

  try {
    const adminEmail = Deno.env.get("SEED_ADMIN_EMAIL")?.trim().toLowerCase();
    const adminPasswordValue = Deno.env.get("SEED_ADMIN_PASSWORD");

    if (!adminEmail || !adminPasswordValue) {
      throw new Error(
        "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set as Edge Function secrets",
      );
    }

    if (adminPasswordValue.length < 15) {
      throw new Error("SEED_ADMIN_PASSWORD must contain at least 15 characters");
    }

    // Credentials are supplied at deployment time and never returned.
    const adminPassword = await bcrypt.hash(adminPasswordValue, 10);
    
    const { data: admin, error: adminError } = await db
      .from('users')
      .upsert({
        email: adminEmail,
        password_hash: adminPassword,
        name: '관리자',
        role: 'admin',
        provider: 'local',
      }, { onConflict: 'email' })
      .select()
      .single();

    if (adminError && adminError.code !== '23505') { // 23505 = unique violation
      console.error("❌ Admin creation error:", adminError);
    } else {
      console.log("✅ Admin user created/updated");
    }

    // 2. Create routes
    const routes = [
      {
        name: '순환선 A',
        type: 'shuttle',
        description: '본관 → 공대 → 기숙사 순환',
        color: '#1E3B8A',
        is_active: true,
      },
      {
        name: '순환선 B',
        type: 'shuttle',
        description: '기숙사 → 본관 → 공대 순환',
        color: '#DC2626',
        is_active: true,
      },
      {
        name: '서울역 노선',
        type: 'commute',
        description: '학교 → 서울역',
        color: '#059669',
        is_active: true,
      },
    ];

    const { data: insertedRoutes, error: routesError } = await db
      .from('routes')
      .upsert(routes, { onConflict: 'name' })
      .select();

    if (routesError) {
      console.error("❌ Routes creation error:", routesError);
    } else {
      console.log(`✅ Created ${insertedRoutes?.length || 0} routes`);
    }

    // 3. Create buses
    const buses = [
      {
        id: 'SCH-01',
        name: '캠퍼스 셔틀 01',
        type: 'shuttle',
        capacity: 45,
        license_plate: '서울12가3456',
        status: 'active',
      },
      {
        id: 'SCH-02',
        name: '캠퍼스 셔틀 02',
        type: 'shuttle',
        capacity: 45,
        license_plate: '서울12가3457',
        status: 'active',
      },
      {
        id: 'SCH-03',
        name: '캠퍼스 셔틀 03',
        type: 'shuttle',
        capacity: 45,
        license_plate: '서울12가3458',
        status: 'active',
      },
      {
        id: 'COM-01',
        name: '통근버스 01',
        type: 'commute',
        capacity: 45,
        license_plate: '서울12가3459',
        status: 'active',
      },
    ];

    const { data: insertedBuses, error: busesError } = await db
      .from('buses')
      .upsert(buses, { onConflict: 'id' })
      .select();

    if (busesError) {
      console.error("❌ Buses creation error:", busesError);
    } else {
      console.log(`✅ Created ${insertedBuses?.length || 0} buses`);
    }

    // 4. Create bus locations
    const busLocations = [
      {
        bus_id: 'SCH-01',
        latitude: 36.8005,
        longitude: 127.0763,
        speed: 0,
        heading: 0,
      },
      {
        bus_id: 'SCH-02',
        latitude: 36.7985,
        longitude: 127.0743,
        speed: 0,
        heading: 90,
      },
      {
        bus_id: 'SCH-03',
        latitude: 36.7995,
        longitude: 127.0753,
        speed: 0,
        heading: 180,
      },
    ];

    const { data: insertedLocations, error: locationsError } = await db
      .from('bus_locations')
      .insert(busLocations)
      .select();

    if (locationsError) {
      console.error("❌ Bus locations creation error:", locationsError);
    } else {
      console.log(`✅ Created ${insertedLocations?.length || 0} bus locations`);
    }

    // 5. Create sample notices (관리자가 작성)
    if (admin) {
      const notices = [
        {
          title: '봄학기 새로운 셔틀 시간표',
          content: '3월 1일부터 새로운 셔틀 시간표가 적용됩니다. 업데이트된 시간표를 확인해주세요.\n\n주요 변경사항:\n- 아침 첫차 시간 30분 앞당김\n- 저녁 막차 시간 1시간 연장\n- 점심시간 배차 간격 단축',
          category: 'general',
          priority: 'medium',
          author_id: admin.id,
          is_pinned: true,
        },
        {
          title: '임시 정류장 변경 안내',
          content: '공사로 인해 공과대학 정류장이 남쪽으로 50m 임시 이동됩니다.\n\n변경 기간: 3월 15일 ~ 4월 30일\n임시 정류장 위치: 공대 본관 후문 앞',
          category: 'route',
          priority: 'high',
          author_id: admin.id,
          is_pinned: true,
        },
        {
          title: '심야 셔틀 운행 연장',
          content: '시험기간 동안 심야 셔틀이 오후 11시까지 운행됩니다.\n\n운행 기간: 중간고사/기말고사 기간\n운행 노선: 순환선 A, B',
          category: 'general',
          priority: 'medium',
          author_id: admin.id,
        },
        {
          title: '버스 추적 앱 업데이트',
          content: 'SCH Shuttle 앱이 업데이트되었습니다.\n\n새로운 기능:\n- 실시간 버스 위치 추적\n- 도착 예정 시간 표시\n- 즐겨찾기 정류장 설정',
          category: 'general',
          priority: 'low',
          author_id: admin.id,
        },
      ];

      const { data: insertedNotices, error: noticesError } = await db
        .from('notices')
        .insert(notices)
        .select();

      if (noticesError) {
        console.error("❌ Notices creation error:", noticesError);
      } else {
        console.log(`✅ Created ${insertedNotices?.length || 0} notices`);
      }
    }

    console.log("🎉 Database seeding completed successfully!");
    
    return {
      success: true,
      message: "Database seeded successfully",
    };

  } catch (error: any) {
    console.error("❌ Seeding error:", error);
    throw error;
  }
}
