import type { BusRoute, ShuttleVariant } from "../types";

export type ScheduleBasis = "bus_departure" | "train_departure" | "train_arrival";

export interface ShuttleServiceRule {
  shuttleVariant?: ShuttleVariant | null;
  schedule?: string | null;
  scheduleBasis?: ScheduleBasis | null;
  intervalMinutes?: number | null;
  departureOffsetMinutes?: number | null;
  boardingWaitMinutes?: number | null;
}

export interface NextShuttleService {
  eventAt: Date;
  departureAt: Date;
  dayOffset: number;
  eventLabel: string;
  departureLabel: string;
}

export function parseScheduleTimes(schedule?: string | null) {
  return (schedule || "")
    .split(/[,\n]/)
    .map((time) => time.trim())
    .filter((time) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(time))
    .map((time) => {
      const [hour, minute] = time.split(":").map(Number);
      return { hour, minute, label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
    })
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}

function atTime(base: Date, hour: number, minute: number, dayOffset = 0) {
  const result = new Date(base);
  result.setDate(result.getDate() + dayOffset);
  result.setHours(hour, minute, 0, 0);
  return result;
}

function dayDifference(from: Date, to: Date) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
}

function serviceOffsets(rule: ShuttleServiceRule) {
  if (rule.shuttleVariant === "campus_to_station") {
    return { beforeMinutes: Math.max(0, rule.departureOffsetMinutes ?? 10), afterMinutes: 0 };
  }
  if (rule.shuttleVariant === "station_to_campus" || rule.shuttleVariant === "station_to_campus_loop") {
    return { beforeMinutes: 0, afterMinutes: Math.max(0, rule.boardingWaitMinutes ?? 5) };
  }
  return { beforeMinutes: 0, afterMinutes: 0 };
}

export function getNextShuttleService(rule: ShuttleServiceRule, now = new Date()): NextShuttleService | null {
  if (rule.shuttleVariant === "campus_loop") {
    const interval = Math.max(1, rule.intervalMinutes ?? 10);
    const departureAt = new Date(now);
    departureAt.setSeconds(0, 0);
    const minutes = departureAt.getHours() * 60 + departureAt.getMinutes();
    const nextMinutes = Math.ceil(minutes / interval) * interval;
    departureAt.setHours(0, nextMinutes, 0, 0);
    if (departureAt.getTime() < now.getTime()) departureAt.setMinutes(departureAt.getMinutes() + interval);
    return {
      eventAt: departureAt,
      departureAt,
      dayOffset: dayDifference(now, departureAt),
      eventLabel: "셔틀 출발",
      departureLabel: "셔틀 출발",
    };
  }

  const times = parseScheduleTimes(rule.schedule);
  if (times.length === 0) return null;
  const { beforeMinutes, afterMinutes } = serviceOffsets(rule);

  for (let dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
    for (const time of times) {
      const eventAt = atTime(now, time.hour, time.minute, dayOffset);
      const departureAt = new Date(eventAt.getTime() + (afterMinutes - beforeMinutes) * 60_000);
      if (departureAt.getTime() >= now.getTime()) {
        return {
          eventAt,
          departureAt,
          dayOffset: dayDifference(now, departureAt),
          eventLabel: rule.shuttleVariant === "campus_to_station" ? "지하철 출발" : "지하철 도착",
          departureLabel: rule.shuttleVariant === "campus_to_station" ? "후문 출발" : "신창역 출발",
        };
      }
    }
  }

  return null;
}

export function formatServiceTime(date: Date, dayOffset = 0) {
  const time = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return dayOffset > 0 ? `내일 ${time}` : time;
}

export function getServiceRuleSummary(route?: Partial<BusRoute> | null) {
  if (!route) return "";
  if (route.shuttleVariant === "campus_loop") return `${route.intervalMinutes ?? 10}분 간격 출발`;
  if (route.shuttleVariant === "campus_to_station") {
    return `지하철 출발 ${route.departureOffsetMinutes ?? 10}분 전 후문 출발`;
  }
  if (route.shuttleVariant === "station_to_campus_loop") {
    return `지하철 도착 ${route.boardingWaitMinutes ?? 5}분 후 출발 · 후문 도착 후 학내순환 1회`;
  }
  if (route.shuttleVariant === "station_to_campus") {
    return `지하철 도착 ${route.boardingWaitMinutes ?? 5}분 후 출발 · 후문 종착`;
  }
  return route.duration || route.description || "";
}
