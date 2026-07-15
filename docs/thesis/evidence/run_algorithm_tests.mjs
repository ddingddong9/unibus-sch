import assert from "node:assert/strict";
import {
  bearingDegrees,
  createRouteTrack,
  distanceMeters,
  normalizePath,
  sampleTrack,
} from "../../../src/app/utils/routeMotion.ts";
import {
  formatServiceTime,
  getNextShuttleService,
  getServiceRuleSummary,
  parseScheduleTimes,
} from "../../../src/app/utils/shuttleSchedule.ts";
import { estimateStopArrivals } from "../../../src/app/utils/shuttleEta.ts";
import {
  simulateCampusLoop,
  simulateStationShuttle,
} from "../../../src/app/utils/campusLoopSimulation.ts";

const results = [];

function test(id, area, description, run) {
  const startedAt = performance.now();
  try {
    run();
    results.push({ id, area, description, status: "pass", durationMs: performance.now() - startedAt });
  } catch (error) {
    results.push({
      id,
      area,
      description,
      status: "fail",
      durationMs: performance.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const rectanglePath = [
  [126.9300, 36.7700],
  [126.9310, 36.7700],
  [126.9310, 36.7710],
  [126.9300, 36.7710],
  [126.9300, 36.7700],
];

const loopStops = [
  { id: "s1", name: "후문", lng: 126.9300, lat: 36.7700, order: 1 },
  { id: "s2", name: "향설생활관3", lng: 126.9310, lat: 36.7700, order: 2 },
  { id: "s3", name: "정문", lng: 126.9310, lat: 36.7710, order: 3 },
];

test("SCH-01", "schedule", "시간표 문자열에서 유효한 시각만 정렬한다", () => {
  assert.deepEqual(
    parseScheduleTimes("10:30, 08:05\n25:00, 9:15, invalid").map((item) => item.label),
    ["08:05", "09:15", "10:30"],
  );
});

test("SCH-02", "schedule", "학내순환은 10분 간격의 다음 출발을 계산한다", () => {
  const next = getNextShuttleService(
    { shuttleVariant: "campus_loop", intervalMinutes: 10 },
    new Date("2026-07-15T10:03:00+09:00"),
  );
  assert.equal(formatServiceTime(next.departureAt), "10:10");
});

test("SCH-03", "schedule", "출발 시각을 지난 직후에는 다음 간격으로 넘긴다", () => {
  const next = getNextShuttleService(
    { shuttleVariant: "campus_loop", intervalMinutes: 10 },
    new Date("2026-07-15T10:10:30+09:00"),
  );
  assert.equal(formatServiceTime(next.departureAt), "10:20");
});

test("SCH-04", "schedule", "후문발 셔틀은 전철 출발 10분 전에 출발한다", () => {
  const next = getNextShuttleService(
    { shuttleVariant: "campus_to_station", schedule: "10:00", departureOffsetMinutes: 10 },
    new Date("2026-07-15T09:40:00+09:00"),
  );
  assert.equal(formatServiceTime(next.eventAt), "10:00");
  assert.equal(formatServiceTime(next.departureAt), "09:50");
});

test("SCH-05", "schedule", "신창역발 셔틀은 전철 도착 5분 뒤에 출발한다", () => {
  const next = getNextShuttleService(
    { shuttleVariant: "station_to_campus", schedule: "10:00", boardingWaitMinutes: 5 },
    new Date("2026-07-15T09:40:00+09:00"),
  );
  assert.equal(formatServiceTime(next.eventAt), "10:00");
  assert.equal(formatServiceTime(next.departureAt), "10:05");
});

test("SCH-06", "schedule", "당일 운행이 끝나면 다음 날 첫 운행을 선택한다", () => {
  const next = getNextShuttleService(
    { shuttleVariant: "campus_to_station", schedule: "06:30", departureOffsetMinutes: 10 },
    new Date("2026-07-15T23:00:00+09:00"),
  );
  assert.equal(next.dayOffset, 1);
  assert.match(formatServiceTime(next.departureAt, next.dayOffset), /^내일 /);
});

test("SCH-07", "schedule", "운행 변형 설명에 학내순환 연계가 표시된다", () => {
  assert.match(
    getServiceRuleSummary({ shuttleVariant: "station_to_campus_loop", boardingWaitMinutes: 5 }),
    /학내순환 1회/,
  );
});

test("MOT-01", "route-motion", "위도 0.001도 거리는 약 111.2m이다", () => {
  const measured = distanceMeters(
    { lat: 36.7700, lng: 126.9300 },
    { lat: 36.7710, lng: 126.9300 },
  );
  assert.ok(measured > 110.5 && measured < 112.0, `measured=${measured}`);
});

test("MOT-02", "route-motion", "0.5m 이하의 중복 경로점을 제거한다", () => {
  const points = normalizePath([
    { lat: 36.7700, lng: 126.9300 },
    { lat: 36.770001, lng: 126.930001 },
    { lat: 36.7710, lng: 126.9300 },
  ]);
  assert.equal(points.length, 2);
});

test("MOT-03", "route-motion", "경로 트랙을 지정 간격으로 재표본화한다", () => {
  const track = createRouteTrack(
    rectanglePath.map(([lng, lat]) => ({ lat, lng })),
    6,
  );
  assert.ok(track.lengthMeters > 390 && track.lengthMeters < 410, `length=${track.lengthMeters}`);
  assert.ok(track.points.length >= 65 && track.points.length <= 70, `samples=${track.points.length}`);
});

test("MOT-04", "route-motion", "트랙의 절반 지점을 경로 위에서 표본화한다", () => {
  const track = createRouteTrack(rectanglePath.map(([lng, lat]) => ({ lat, lng })), 6);
  const midpoint = sampleTrack(track, track.lengthMeters / 2);
  const onNorthEdge = Math.abs(midpoint.lat - 36.7710) < 0.00003;
  assert.ok(onNorthEdge, JSON.stringify(midpoint));
});

test("MOT-05", "route-motion", "정북 방향의 방위각을 0도로 계산한다", () => {
  const heading = bearingDegrees(
    { lat: 36.7700, lng: 126.9300 },
    { lat: 36.7710, lng: 126.9300 },
  );
  assert.ok(heading < 0.001 || heading > 359.999, `heading=${heading}`);
});

test("ETA-01", "eta", "최신 위치의 버스에 대해 다음 정류장 ETA를 계산한다", () => {
  const nowMs = new Date("2026-07-15T10:00:00+09:00").getTime();
  const estimates = estimateStopArrivals(
    rectanglePath,
    loopStops,
    [{
      id: "b1",
      label: "학내순환 1호",
      position: { lat: 36.7700, lng: 126.9305 },
      speed: 5,
      timestamp: new Date(nowMs - 1_000).toISOString(),
    }],
    { loop: true, nowMs },
  );
  assert.equal(estimates.get("s2").busId, "b1");
  assert.equal(estimates.get("s2").state, "arriving");
});

test("ETA-02", "eta", "45초를 초과한 위치 정보는 오래된 상태로 처리한다", () => {
  const nowMs = new Date("2026-07-15T10:00:00+09:00").getTime();
  const estimates = estimateStopArrivals(
    rectanglePath,
    loopStops,
    [{
      id: "b1",
      label: "학내순환 1호",
      position: { lat: 36.7700, lng: 126.9305 },
      timestamp: new Date(nowMs - 46_000).toISOString(),
    }],
    { loop: true, nowMs },
  );
  assert.equal(estimates.get("s2").state, "stale");
});

test("ETA-03", "eta", "운행 버스가 없으면 대기 상태를 표시한다", () => {
  const estimates = estimateStopArrivals(rectanglePath, loopStops, [], { loop: true });
  assert.equal(estimates.get("s1").state, "waiting");
});

test("ETA-04", "eta", "역 대기 중인 버스의 계획 출발 시간을 ETA에 반영한다", () => {
  const nowMs = new Date("2026-07-15T10:00:00+09:00").getTime();
  const estimates = estimateStopArrivals(
    rectanglePath,
    loopStops,
    [{
      id: "b1",
      label: "신창역 셔틀",
      position: { lat: 36.7700, lng: 126.9300 },
      timestamp: new Date(nowMs).toISOString(),
      plannedDepartureAt: new Date(nowMs + 5 * 60_000).toISOString(),
      servicePhase: "waiting_station",
    }],
    { loop: true, nowMs },
  );
  assert.ok(estimates.get("s2").minutes >= 5);
});

test("SIM-01", "simulation", "학내순환 시뮬레이션은 3대의 버스를 생성한다", () => {
  const simulated = simulateCampusLoop(
    rectanglePath,
    loopStops,
    new Date("2026-07-15T10:00:00+09:00").getTime(),
    10,
  );
  assert.equal(simulated.buses.length, 3);
  assert.equal(simulated.stopDepartures.size, 3);
});

test("SIM-02", "simulation", "동일 입력 시 시뮬레이션 결과가 결정적이다", () => {
  const nowMs = new Date("2026-07-15T10:00:00+09:00").getTime();
  const first = simulateCampusLoop(rectanglePath, loopStops, nowMs, 10);
  const second = simulateCampusLoop(rectanglePath, loopStops, nowMs, 10);
  assert.deepEqual(first, second);
});

test("SIM-03", "simulation", "24시간의 표본에서 학내순환 버스 좌표가 경계 상자를 벗어나지 않는다", () => {
  const start = new Date("2026-07-15T00:00:00+09:00").getTime();
  for (let minute = 0; minute < 24 * 60; minute += 3) {
    const simulated = simulateCampusLoop(rectanglePath, loopStops, start + minute * 60_000, 10);
    for (const bus of simulated.buses) {
      assert.ok(bus.position.lat >= 36.7700 && bus.position.lat <= 36.7710);
      assert.ok(bus.position.lng >= 126.9300 && bus.position.lng <= 126.9310);
    }
  }
});

test("SIM-04", "simulation", "신창역 왕복 시뮬레이션은 한 대와 양 끝 정류장 출발 정보를 생성한다", () => {
  const openPath = rectanglePath.slice(0, 3);
  const endStops = [loopStops[0], loopStops[2]];
  const simulated = simulateStationShuttle(
    openPath,
    endStops,
    new Date("2026-07-15T10:00:00+09:00").getTime(),
  );
  assert.equal(simulated.buses.length, 1);
  assert.equal(simulated.stopDepartures.size, 2);
});

test("SIM-05", "simulation", "신창역 셔틀 좌표가 24시간 표본에서 경계 상자를 벗어나지 않는다", () => {
  const openPath = rectanglePath.slice(0, 3);
  const endStops = [loopStops[0], loopStops[2]];
  const start = new Date("2026-07-15T00:00:00+09:00").getTime();
  for (let minute = 0; minute < 24 * 60; minute += 3) {
    const bus = simulateStationShuttle(openPath, endStops, start + minute * 60_000).buses[0];
    assert.ok(bus.position.lat >= 36.7700 && bus.position.lat <= 36.7710);
    assert.ok(bus.position.lng >= 126.9300 && bus.position.lng <= 126.9310);
  }
});

const passed = results.filter((result) => result.status === "pass").length;
const failed = results.length - passed;
const summary = {
  generatedAt: new Date().toISOString(),
  runtime: process.version,
  command: "node --experimental-strip-types docs/thesis/evidence/run_algorithm_tests.mjs",
  passed,
  failed,
  total: results.length,
  results: results.map((result) => ({
    ...result,
    durationMs: Number(result.durationMs.toFixed(3)),
  })),
};

console.log(JSON.stringify(summary, null, 2));
if (failed > 0) process.exitCode = 1;
