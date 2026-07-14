export type TransitServiceVariant =
  | "campus_loop"
  | "campus_to_station"
  | "station_to_campus"
  | "station_to_campus_loop";

export type SimulationTime = number | string | Date;

export type TransitSimulationStatus = "scheduled" | "boarding" | "in_service" | "completed";

export type TransitSimulationPhase =
  | "waiting_for_departure"
  | "waiting_for_train"
  | "boarding"
  | "campus_loop"
  | "to_station"
  | "to_campus"
  | "completed";

export type TransitSimulationDirection = "none" | "loop" | "outbound" | "inbound";

export type TransitSimulationEventType =
  | "train_arrival"
  | "train_departure"
  | "vehicle_departure"
  | "route_arrival"
  | "service_completed";

export interface TransitRouteLeg {
  routeId: string;
  /** Route distance in the same world units used by the 3D route track. */
  routeLength: number;
  durationMinutes: number;
}

export interface TransitSimulationRoute extends TransitRouteLeg {
  variant: TransitServiceVariant;
  /** Required to continue a station-to-campus service around the campus. */
  continuation?: TransitRouteLeg | null;
}

export interface TransitServiceRule {
  /** Campus loop departure interval. Defaults to 10 minutes. */
  intervalMinutes?: number;
  /** Campus departure offset before a train departure. Defaults to 10 minutes. */
  departureOffsetMinutes?: number;
  /** Boarding wait after a train arrival. Defaults to 5 minutes. */
  boardingWaitMinutes?: number;
  /** Explicit train event timestamps for station services. */
  eventTimes?: readonly SimulationTime[];
  /** Local daily train times such as `06:30, 07:10`. */
  dailySchedule?: string | readonly string[];
  /** Timestamp representing local midnight for dailySchedule expansion. */
  serviceDayStartAt?: SimulationTime;
  /** Campus loop interval anchor. Defaults to serviceDayStartAt, then Unix epoch. */
  anchorAt?: SimulationTime;
  serviceStartAt?: SimulationTime;
  serviceEndAt?: SimulationTime;
}

export interface TransitSimulationEvent {
  type: TransitSimulationEventType;
  at: number;
  routeId: string;
  label: string;
  minutesUntil: number;
}

export interface TransitVehicleSimulation {
  id: string;
  source: "simulation";
  serviceVariant: TransitServiceVariant;
  status: TransitSimulationStatus;
  phase: TransitSimulationPhase;
  direction: TransitSimulationDirection;
  routeId: string;
  routeLength: number;
  routeProgress: number;
  normalizedProgress: number;
  serviceProgress: number;
  eventAt: number;
  departureAt: number;
  arrivalAt: number;
  completedAt: number;
  nextEvent: TransitSimulationEvent | null;
}

export interface SimulateTransitTripInput {
  now: SimulationTime;
  route: TransitSimulationRoute;
  rule?: TransitServiceRule;
  /** Train event for station routes, or departure time for campus loops. */
  eventAt: SimulationTime;
  vehicleId?: string;
}

export interface SimulateTransitServiceInput {
  now: SimulationTime;
  route: TransitSimulationRoute;
  rule?: TransitServiceRule;
  /** Includes one scheduled vehicle after currently active vehicles. Defaults to true. */
  includeUpcomingVehicle?: boolean;
  maximumVehicles?: number;
}

export interface TransitServiceSimulation {
  source: "simulation";
  generatedAt: number;
  routeId: string;
  serviceVariant: TransitServiceVariant;
  vehicles: TransitVehicleSimulation[];
  activeVehicleCount: number;
  nextDepartureAt: number | null;
  nextEvent: TransitSimulationEvent | null;
}

interface TripTiming {
  eventAt: number;
  departureAt: number;
  arrivalAt: number;
  completedAt: number;
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const DEFAULT_INTERVAL_MINUTES = 10;
const DEFAULT_DEPARTURE_OFFSET_MINUTES = 10;
const DEFAULT_BOARDING_WAIT_MINUTES = 5;
const DEFAULT_MAXIMUM_VEHICLES = 24;

function timestamp(value: SimulationTime, field: string) {
  const result = value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(result)) throw new Error(`${field} must be a valid timestamp`);
  return result;
}

function positive(value: number, field: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be greater than zero`);
  return value;
}

function nonNegative(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be zero or greater`);
  return value;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function timingFor(route: TransitSimulationRoute, rule: TransitServiceRule, eventAt: number): TripTiming {
  const routeDuration = positive(route.durationMinutes, "route.durationMinutes") * MINUTE_MS;
  const continuationDuration = route.variant === "station_to_campus_loop"
    ? positive(route.continuation?.durationMinutes ?? 0, "route.continuation.durationMinutes") * MINUTE_MS
    : 0;
  let departureAt = eventAt;

  if (route.variant === "campus_to_station") {
    const offset = nonNegative(
      rule.departureOffsetMinutes ?? DEFAULT_DEPARTURE_OFFSET_MINUTES,
      "rule.departureOffsetMinutes",
    );
    departureAt -= offset * MINUTE_MS;
  } else if (route.variant === "station_to_campus" || route.variant === "station_to_campus_loop") {
    const wait = nonNegative(
      rule.boardingWaitMinutes ?? DEFAULT_BOARDING_WAIT_MINUTES,
      "rule.boardingWaitMinutes",
    );
    departureAt += wait * MINUTE_MS;
  }

  const arrivalAt = departureAt + routeDuration;
  return { eventAt, departureAt, arrivalAt, completedAt: arrivalAt + continuationDuration };
}

function eventLabel(type: TransitSimulationEventType) {
  switch (type) {
    case "train_arrival": return "열차 도착";
    case "train_departure": return "열차 출발";
    case "vehicle_departure": return "셔틀 출발";
    case "route_arrival": return "노선 도착";
    case "service_completed": return "운행 종료";
  }
}

function makeEvent(
  type: TransitSimulationEventType,
  at: number,
  routeId: string,
  now: number,
): TransitSimulationEvent {
  return { type, at, routeId, label: eventLabel(type), minutesUntil: Math.max(0, (at - now) / MINUTE_MS) };
}

function nextTripEvent(
  route: TransitSimulationRoute,
  timing: TripTiming,
  now: number,
): TransitSimulationEvent | null {
  const trainType = route.variant === "campus_to_station"
    ? "train_departure"
    : route.variant === "station_to_campus" || route.variant === "station_to_campus_loop"
      ? "train_arrival"
      : null;
  const events: TransitSimulationEvent[] = [
    makeEvent("vehicle_departure", timing.departureAt, route.routeId, now),
    makeEvent("route_arrival", timing.arrivalAt, route.routeId, now),
  ];

  if (trainType) events.push(makeEvent(trainType, timing.eventAt, route.routeId, now));
  if (route.variant === "station_to_campus_loop" && route.continuation) {
    events.push(makeEvent("service_completed", timing.completedAt, route.continuation.routeId, now));
  }

  return events
    .filter((event) => event.at > now)
    .sort((left, right) => left.at - right.at)[0] ?? null;
}

function validateRoute(route: TransitSimulationRoute) {
  if (!route.routeId.trim()) throw new Error("route.routeId is required");
  positive(route.routeLength, "route.routeLength");
  positive(route.durationMinutes, "route.durationMinutes");
  if (route.variant === "station_to_campus_loop") {
    if (!route.continuation?.routeId.trim()) throw new Error("route.continuation is required for station_to_campus_loop");
    positive(route.continuation.routeLength, "route.continuation.routeLength");
    positive(route.continuation.durationMinutes, "route.continuation.durationMinutes");
  }
}

/** Calculates one vehicle solely from the supplied clock and schedule occurrence. */
export function simulateTransitTrip(input: SimulateTransitTripInput): TransitVehicleSimulation {
  const now = timestamp(input.now, "now");
  const eventAt = timestamp(input.eventAt, "eventAt");
  const route = input.route;
  const rule = input.rule ?? {};
  validateRoute(route);
  const timing = timingFor(route, rule, eventAt);
  const primaryDuration = timing.arrivalAt - timing.departureAt;
  const totalDuration = timing.completedAt - timing.departureAt;
  const serviceProgress = clamp01((now - timing.departureAt) / totalDuration);
  let status: TransitSimulationStatus;
  let phase: TransitSimulationPhase;
  let direction: TransitSimulationDirection;
  let activeRoute: TransitRouteLeg = route;
  let normalizedProgress = 0;

  if (now < timing.departureAt) {
    if ((route.variant === "station_to_campus" || route.variant === "station_to_campus_loop") && now >= timing.eventAt) {
      status = "boarding";
      phase = "boarding";
    } else {
      status = "scheduled";
      phase = route.variant === "station_to_campus" || route.variant === "station_to_campus_loop"
        ? "waiting_for_train"
        : "waiting_for_departure";
    }
    direction = "none";
  } else if (now < timing.arrivalAt) {
    status = "in_service";
    phase = route.variant === "campus_loop"
      ? "campus_loop"
      : route.variant === "campus_to_station" ? "to_station" : "to_campus";
    direction = route.variant === "campus_loop"
      ? "loop"
      : route.variant === "campus_to_station" ? "outbound" : "inbound";
    normalizedProgress = clamp01((now - timing.departureAt) / primaryDuration);
  } else if (route.variant === "station_to_campus_loop" && now < timing.completedAt && route.continuation) {
    status = "in_service";
    phase = "campus_loop";
    direction = "loop";
    activeRoute = route.continuation;
    normalizedProgress = clamp01((now - timing.arrivalAt) / (timing.completedAt - timing.arrivalAt));
  } else {
    status = "completed";
    phase = "completed";
    direction = "none";
    normalizedProgress = 1;
    if (route.variant === "station_to_campus_loop" && route.continuation) activeRoute = route.continuation;
  }

  return {
    id: input.vehicleId ?? `${route.routeId}:${timing.departureAt}`,
    source: "simulation",
    serviceVariant: route.variant,
    status,
    phase,
    direction,
    routeId: activeRoute.routeId,
    routeLength: activeRoute.routeLength,
    routeProgress: normalizedProgress * activeRoute.routeLength,
    normalizedProgress,
    serviceProgress,
    ...timing,
    nextEvent: nextTripEvent(route, timing, now),
  };
}

/** Converts a comma/newline separated HH:mm schedule into minutes after local midnight. */
export function parseDailySchedule(schedule?: string | readonly string[] | null) {
  const tokens = typeof schedule === "string" ? schedule.split(/[\n,]/) : schedule ?? [];
  return [...new Set(tokens
    .map((value) => value.trim())
    .filter((value) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(value))
    .map((value) => {
      const [hour, minute] = value.split(":").map(Number);
      return hour * 60 + minute;
    }))].sort((left, right) => left - right);
}

/** Expands local daily schedule entries around the requested instant without timezone assumptions. */
export function expandDailyEventTimes(
  schedule: string | readonly string[],
  serviceDayStartAt: SimulationTime,
  around: SimulationTime,
  daysBefore = 1,
  daysAfter = 2,
) {
  const dayStart = timestamp(serviceDayStartAt, "serviceDayStartAt");
  const now = timestamp(around, "around");
  const dayIndex = Math.floor((now - dayStart) / DAY_MS);
  const minutes = parseDailySchedule(schedule);
  const before = Math.floor(nonNegative(daysBefore, "daysBefore"));
  const after = Math.floor(nonNegative(daysAfter, "daysAfter"));
  const result: number[] = [];

  for (let offset = -before; offset <= after; offset += 1) {
    const base = dayStart + (dayIndex + offset) * DAY_MS;
    for (const minute of minutes) result.push(base + minute * MINUTE_MS);
  }
  return result.sort((left, right) => left - right);
}

function withinServiceWindow(time: number, rule: TransitServiceRule) {
  const start = rule.serviceStartAt === undefined ? Number.NEGATIVE_INFINITY : timestamp(rule.serviceStartAt, "serviceStartAt");
  const end = rule.serviceEndAt === undefined ? Number.POSITIVE_INFINITY : timestamp(rule.serviceEndAt, "serviceEndAt");
  return time >= start && time <= end;
}

function eventTimesFor(rule: TransitServiceRule, now: number) {
  const explicit = (rule.eventTimes ?? []).map((value) => timestamp(value, "rule.eventTimes"));
  if (rule.dailySchedule && rule.serviceDayStartAt === undefined) {
    throw new Error("rule.serviceDayStartAt is required with rule.dailySchedule");
  }
  const daily = rule.dailySchedule && rule.serviceDayStartAt !== undefined
    ? expandDailyEventTimes(rule.dailySchedule, rule.serviceDayStartAt, now)
    : [];
  return [...new Set([...explicit, ...daily])]
    .filter((value) => withinServiceWindow(value, rule))
    .sort((left, right) => left - right);
}

function firstFutureDeparture(vehicles: readonly TransitVehicleSimulation[], now: number) {
  return vehicles
    .filter((vehicle) => vehicle.departureAt > now)
    .sort((left, right) => left.departureAt - right.departureAt)[0]?.departureAt ?? null;
}

function firstNextEvent(vehicles: readonly TransitVehicleSimulation[]) {
  return vehicles
    .flatMap((vehicle) => vehicle.nextEvent ? [vehicle.nextEvent] : [])
    .sort((left, right) => left.at - right.at)[0] ?? null;
}

function simulateLoopService(input: SimulateTransitServiceInput, now: number, maximum: number) {
  const rule = input.rule ?? {};
  const interval = positive(rule.intervalMinutes ?? DEFAULT_INTERVAL_MINUTES, "rule.intervalMinutes") * MINUTE_MS;
  const anchor = rule.anchorAt !== undefined
    ? timestamp(rule.anchorAt, "rule.anchorAt")
    : rule.serviceDayStartAt !== undefined ? timestamp(rule.serviceDayStartAt, "rule.serviceDayStartAt") : 0;
  const duration = positive(input.route.durationMinutes, "route.durationMinutes") * MINUTE_MS;
  const earliest = now - duration;
  const firstIndex = Math.ceil((earliest - anchor) / interval);
  const currentIndex = Math.floor((now - anchor) / interval);
  const vehicles: TransitVehicleSimulation[] = [];

  for (let index = firstIndex; index <= currentIndex && vehicles.length < maximum; index += 1) {
    const departureAt = anchor + index * interval;
    if (!withinServiceWindow(departureAt, rule)) continue;
    const vehicle = simulateTransitTrip({ now, route: input.route, rule, eventAt: departureAt });
    if (vehicle.status === "in_service") vehicles.push(vehicle);
  }

  if (input.includeUpcomingVehicle !== false && vehicles.length < maximum) {
    let nextIndex = Math.floor((now - anchor) / interval) + 1;
    let nextDeparture = anchor + nextIndex * interval;
    while (!withinServiceWindow(nextDeparture, rule) && rule.serviceStartAt !== undefined && nextDeparture < timestamp(rule.serviceStartAt, "serviceStartAt")) {
      nextIndex += 1;
      nextDeparture = anchor + nextIndex * interval;
    }
    if (withinServiceWindow(nextDeparture, rule)) {
      vehicles.push(simulateTransitTrip({ now, route: input.route, rule, eventAt: nextDeparture }));
    }
  }
  return vehicles;
}

function simulateScheduledService(input: SimulateTransitServiceInput, now: number, maximum: number) {
  const rule = input.rule ?? {};
  const candidates = eventTimesFor(rule, now)
    .map((eventAt) => simulateTransitTrip({ now, route: input.route, rule, eventAt }))
    .filter((vehicle) => vehicle.completedAt > now);
  const active = candidates.filter((vehicle) => vehicle.status === "boarding" || vehicle.status === "in_service");
  const future = candidates
    .filter((vehicle) => vehicle.status === "scheduled")
    .sort((left, right) => left.departureAt - right.departureAt);
  const vehicles = active.sort((left, right) => left.departureAt - right.departureAt).slice(0, maximum);
  if (input.includeUpcomingVehicle !== false && future[0] && vehicles.length < maximum) vehicles.push(future[0]);
  return vehicles;
}

/** Produces all active vehicles plus the next scheduled vehicle for a service. */
export function simulateTransitService(input: SimulateTransitServiceInput): TransitServiceSimulation {
  const now = timestamp(input.now, "now");
  const maximum = Math.max(
    1,
    Math.floor(positive(input.maximumVehicles ?? DEFAULT_MAXIMUM_VEHICLES, "maximumVehicles")),
  );
  validateRoute(input.route);
  const vehicles = input.route.variant === "campus_loop"
    ? simulateLoopService(input, now, maximum)
    : simulateScheduledService(input, now, maximum);

  return {
    source: "simulation",
    generatedAt: now,
    routeId: input.route.routeId,
    serviceVariant: input.route.variant,
    vehicles,
    activeVehicleCount: vehicles.filter((vehicle) => vehicle.status === "boarding" || vehicle.status === "in_service").length,
    nextDepartureAt: firstFutureDeparture(vehicles, now),
    nextEvent: firstNextEvent(vehicles),
  };
}

/** Combines independent route services into one deterministic 3D fleet snapshot. */
export function simulateTransitFleet(inputs: readonly SimulateTransitServiceInput[]) {
  return inputs.map(simulateTransitService);
}
