export interface DriverRoute {
  id: string;
  name: string;
  type?: string;
  shuttleVariant?: 'campus_loop' | 'campus_to_station' | 'station_to_campus' | 'station_to_campus_loop' | null;
  color?: string | null;
  description?: string | null;
  region?: string | null;
  schedule?: string | null;
  duration?: string | null;
  fare?: string | null;
}

export interface DriverRouteBus {
  type?: string;
  currentRoute?: DriverRoute | null;
}

const STATION_SHUTTLE_PATTERN = /신창|순천향대역|순천향대학교역/;

export function isStationShuttleRoute(route?: DriverRoute | null) {
  if (!route) return false;
  if (route.shuttleVariant && route.shuttleVariant !== "campus_loop") return true;
  return STATION_SHUTTLE_PATTERN.test(
    [route.name, route.description, route.region].filter(Boolean).join(" ")
  );
}

export function getBusTypeLabel(bus: DriverRouteBus) {
  if (bus.type === "campus") return "셔틀버스";
  if (bus.type === "direct") return "직행버스";
  return "통학버스";
}

export function getRouteKindLabel(bus: DriverRouteBus) {
  const route = bus.currentRoute;
  if (bus.type === "campus") {
    if (route?.shuttleVariant === "campus_loop") return "학내순환";
    if (isStationShuttleRoute(route)) return "신창역 셔틀";
    return route ? "학내순환" : "셔틀버스";
  }
  return route?.region ? `${route.region} 통학` : getBusTypeLabel(bus);
}

export function getRouteDirectionLabel(route?: DriverRoute | null) {
  if (!route) return "노선 미지정";
  if (route.shuttleVariant === "campus_to_station") {
    const offset = `${route.duration || ""} ${route.description || ""}`.match(/(\d{1,2})\s*분/)?.[1] || "10";
    return `지하철 출발 ${offset}분 전 후문 출발`;
  }
  if (route.shuttleVariant === "station_to_campus_loop") return "후문 도착 후 학내순환 연결";
  if (route.shuttleVariant === "station_to_campus") return "후문 종착";
  if (route.shuttleVariant === "campus_loop") return "학내순환";
  const text = `${route.name || ""} ${route.description || ""}`;

  if (/후문.*신창|학교.*신창/.test(text)) {
    const offset = text.match(/(\d{1,2})\s*분/)?.[1] || "10";
    return `지하철 출발 ${offset}분 전 후문 출발`;
  }
  if (/신창.*학내|학내순환|순환|연결/.test(text)) return "후문 도착 후 학내순환 연결";
  if (/신창.*후문|종착/.test(text)) return "후문 종착";
  return route.description || route.duration || "운행 노선";
}

export function getRouteSchedulePreview(route?: DriverRoute | null) {
  const times = (route?.schedule || "")
    .split(/[,\n]/)
    .map((time) => time.trim())
    .filter(Boolean);

  if (times.length === 0) return route?.duration || "";
  return times.slice(0, 3).join(", ") + (times.length > 3 ? " ..." : "");
}
