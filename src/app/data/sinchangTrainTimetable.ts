export type TrainServiceDay = "weekday" | "holiday";

export interface SinchangTrainDeparture {
  time: string;
  destination: string;
  express?: boolean;
}

export interface UpcomingTrain extends SinchangTrainDeparture {
  minutesUntil: number;
  dayOffset: number;
}

const weekday: SinchangTrainDeparture[] = [
  { time: "05:00", destination: "광운대" },
  { time: "05:42", destination: "광운대" },
  { time: "06:09", destination: "서울역", express: true },
  { time: "06:38", destination: "청량리" },
  { time: "06:54", destination: "광운대" },
  { time: "07:15", destination: "청량리", express: true },
  { time: "07:51", destination: "청량리", express: true },
  { time: "08:11", destination: "구로" },
  { time: "08:40", destination: "광운대" },
  { time: "09:02", destination: "청량리" },
  { time: "09:41", destination: "청량리", express: true },
  { time: "10:16", destination: "청량리", express: true },
  { time: "10:36", destination: "청량리" },
  { time: "10:58", destination: "광운대" },
  { time: "11:21", destination: "광운대" },
  { time: "12:00", destination: "청량리" },
  { time: "12:23", destination: "광운대" },
  { time: "12:52", destination: "광운대" },
  { time: "13:16", destination: "청량리", express: true },
  { time: "13:37", destination: "청량리", express: true },
  { time: "13:58", destination: "광운대" },
  { time: "14:18", destination: "광운대" },
  { time: "14:48", destination: "광운대" },
  { time: "15:13", destination: "청량리", express: true },
  { time: "16:03", destination: "광운대" },
  { time: "16:39", destination: "광운대" },
  { time: "16:55", destination: "광운대" },
  { time: "17:33", destination: "광운대" },
  { time: "18:08", destination: "청량리", express: true },
  { time: "18:27", destination: "구로" },
  { time: "18:56", destination: "광운대" },
  { time: "19:20", destination: "병점" },
  { time: "19:46", destination: "청량리", express: true },
  { time: "20:19", destination: "광운대" },
  { time: "20:35", destination: "구로" },
  { time: "21:06", destination: "병점" },
  { time: "21:39", destination: "병점" },
  { time: "21:57", destination: "구로" },
  { time: "22:14", destination: "구로" },
  { time: "22:42", destination: "병점" },
  { time: "23:17", destination: "병점" },
  { time: "23:45", destination: "천안" },
];

const holiday: SinchangTrainDeparture[] = [
  { time: "05:00", destination: "광운대" },
  { time: "05:40", destination: "광운대" },
  { time: "06:24", destination: "청량리" },
  { time: "07:15", destination: "청량리", express: true },
  { time: "07:30", destination: "광운대" },
  { time: "08:05", destination: "청량리" },
  { time: "08:42", destination: "청량리" },
  { time: "09:38", destination: "청량리", express: true },
  { time: "10:24", destination: "광운대" },
  { time: "10:58", destination: "광운대" },
  { time: "11:31", destination: "광운대" },
  { time: "12:01", destination: "청량리" },
  { time: "12:29", destination: "광운대" },
  { time: "13:02", destination: "광운대" },
  { time: "13:25", destination: "광운대" },
  { time: "13:58", destination: "광운대" },
  { time: "14:21", destination: "청량리" },
  { time: "14:47", destination: "광운대" },
  { time: "15:29", destination: "광운대" },
  { time: "16:09", destination: "청량리", express: true },
  { time: "16:35", destination: "광운대" },
  { time: "17:01", destination: "광운대" },
  { time: "17:33", destination: "광운대" },
  { time: "18:05", destination: "청량리" },
  { time: "18:32", destination: "청량리" },
  { time: "19:00", destination: "광운대" },
  { time: "19:25", destination: "병점" },
  { time: "19:37", destination: "광운대" },
  { time: "20:35", destination: "광운대" },
  { time: "21:17", destination: "병점" },
  { time: "21:38", destination: "구로" },
  { time: "21:55", destination: "구로" },
  { time: "22:14", destination: "구로" },
  { time: "22:43", destination: "병점" },
  { time: "23:07", destination: "병점" },
  { time: "23:45", destination: "천안" },
];

export const SINCHANG_TRAIN_TIMETABLE: Record<TrainServiceDay, SinchangTrainDeparture[]> = {
  weekday,
  holiday,
};

// 2026년 월력요항에 포함된 평일 공휴일과 전국동시지방선거일.
const KOREAN_PUBLIC_HOLIDAYS_2026 = new Set([
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-03-02",
  "2026-05-01",
  "2026-05-05",
  "2026-05-25",
  "2026-06-03",
  "2026-08-17",
  "2026-09-24",
  "2026-09-25",
  "2026-10-05",
  "2026-10-09",
  "2026-12-25",
]);

const formatLocalDateKey = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");

const toMinutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

export function getTrainServiceDay(date = new Date()): TrainServiceDay {
  const day = date.getDay();
  if (day === 0 || day === 6) return "holiday";
  if (date.getFullYear() === 2026 && KOREAN_PUBLIC_HOLIDAYS_2026.has(formatLocalDateKey(date))) {
    return "holiday";
  }
  return "weekday";
}

export function getUpcomingTrains(
  now = new Date(),
  serviceDay = getTrainServiceDay(now),
  limit = 3,
): UpcomingTrain[] {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const schedule = SINCHANG_TRAIN_TIMETABLE[serviceDay];
  const upcoming = schedule
    .filter((train) => toMinutes(train.time) >= currentMinutes)
    .slice(0, limit)
    .map((train) => ({
      ...train,
      minutesUntil: toMinutes(train.time) - currentMinutes,
      dayOffset: 0,
    }));

  if (upcoming.length >= limit) return upcoming;

  return [
    ...upcoming,
    ...schedule.slice(0, limit - upcoming.length).map((train) => ({
      ...train,
      minutesUntil: 24 * 60 - currentMinutes + toMinutes(train.time),
      dayOffset: 1,
    })),
  ];
}

