import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import type { PerformanceMonitorApi } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export type CampusQualityChangeReason =
  | "initial"
  | "incline"
  | "decline"
  | "fallback";

export interface CampusQualityChange {
  factor: number;
  reason: CampusQualityChangeReason;
  fps: number;
  refreshRate: number;
}

export interface CampusPerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  dpr: number;
  qualityFactor: number;
  sampledAt: number;
}

export interface CampusPerformanceGovernorProps {
  /** Initial monitor quality in the normalized 0..1 range. */
  initialFactor?: number;
  /** Lowest quality/DPR multiplier the governor may select. */
  minFactor?: number;
  /** Highest quality/DPR multiplier the governor may select. */
  maxFactor?: number;
  /** Quality used after repeated performance oscillation. */
  fallbackFactor?: number;
  /** Duration of each FPS measurement window used by PerformanceMonitor. */
  monitorWindowMs?: number;
  /** Number of measurement windows considered before changing quality. */
  monitorIterations?: number;
  /** Fraction of windows that must cross a bound before quality changes. */
  monitorThreshold?: number;
  /** Amount added to or removed from the quality factor per adjustment. */
  monitorStep?: number;
  /** Number of direction changes allowed before falling back permanently. */
  monitorFlipflops?: number;
  /** Override the default FPS bounds for a detected display refresh rate. */
  monitorBounds?: (refreshRate: number) => [lower: number, upper: number];
  /** Approximate interval for lightweight renderer metrics. Set to 0 to disable. */
  metricsIntervalMs?: number;
  /** Enables pixelated canvas scaling while DPR is reduced. */
  pixelated?: boolean;
  onQualityFactor?: (change: CampusQualityChange) => void;
  onMetrics?: (metrics: CampusPerformanceMetrics) => void;
}

interface MetricsSamplerProps {
  intervalMs: number;
  qualityFactorRef: React.MutableRefObject<number>;
  onMetricsRef: React.MutableRefObject<
    CampusPerformanceGovernorProps["onMetrics"]
  >;
}

function clampFactor(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function MetricsSampler({
  intervalMs,
  qualityFactorRef,
  onMetricsRef,
}: MetricsSamplerProps) {
  const gl = useThree((state) => state.gl);
  const getState = useThree((state) => state.get);
  const sampleRef = useRef({
    elapsed: 0,
    frames: 0,
    drawCalls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
  });

  useFrame((_state, delta) => {
    if (intervalMs <= 0 || !onMetricsRef.current) return;

    const sample = sampleRef.current;
    const renderInfo = gl.info.render;
    sample.elapsed += delta;
    sample.frames += 1;
    sample.drawCalls += renderInfo.calls;
    sample.triangles += renderInfo.triangles;
    sample.points += renderInfo.points;
    sample.lines += renderInfo.lines;

    if (sample.elapsed * 1000 < intervalMs) return;

    const fps = sample.frames / sample.elapsed;
    const divisor = Math.max(1, sample.frames);
    const { viewport } = getState();

    onMetricsRef.current({
      fps,
      frameTimeMs: fps > 0 ? 1000 / fps : 0,
      drawCalls: Math.round(sample.drawCalls / divisor),
      triangles: Math.round(sample.triangles / divisor),
      points: Math.round(sample.points / divisor),
      lines: Math.round(sample.lines / divisor),
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      dpr: viewport.dpr,
      qualityFactor: qualityFactorRef.current,
      sampledAt: Date.now(),
    });

    sample.elapsed = 0;
    sample.frames = 0;
    sample.drawCalls = 0;
    sample.triangles = 0;
    sample.points = 0;
    sample.lines = 0;
  });

  return null;
}

export function CampusPerformanceGovernor({
  initialFactor = 0.8,
  minFactor = 0.5,
  maxFactor = 1,
  fallbackFactor = 0.5,
  monitorWindowMs = 250,
  monitorIterations = 8,
  monitorThreshold = 0.75,
  monitorStep = 0.1,
  monitorFlipflops = 4,
  monitorBounds,
  metricsIntervalMs = 1000,
  pixelated = false,
  onQualityFactor,
  onMetrics,
}: CampusPerformanceGovernorProps) {
  const set = useThree((state) => state.set);
  const normalizedMin = Math.min(minFactor, maxFactor);
  const normalizedMax = Math.max(minFactor, maxFactor);
  const normalizedInitial = clampFactor(
    initialFactor,
    normalizedMin,
    normalizedMax,
  );
  const qualityFactorRef = useRef(normalizedInitial);
  const onQualityFactorRef = useRef(onQualityFactor);
  const onMetricsRef = useRef(onMetrics);

  useEffect(() => {
    onQualityFactorRef.current = onQualityFactor;
  }, [onQualityFactor]);

  useEffect(() => {
    onMetricsRef.current = onMetrics;
  }, [onMetrics]);

  const applyFactor = useCallback(
    (
      factor: number,
      reason: CampusQualityChangeReason,
      api?: PerformanceMonitorApi,
    ) => {
      const nextFactor = clampFactor(
        factor,
        normalizedMin,
        normalizedMax,
      );
      const changed = qualityFactorRef.current !== nextFactor;
      qualityFactorRef.current = nextFactor;

      set((state) => ({
        performance: {
          ...state.performance,
          current: nextFactor,
        },
      }));

      if (changed || reason === "initial" || reason === "fallback") {
        onQualityFactorRef.current?.({
          factor: nextFactor,
          reason,
          fps: api?.fps ?? 0,
          refreshRate: api?.refreshrate ?? 0,
        });
      }
    },
    [normalizedMax, normalizedMin, set],
  );

  useLayoutEffect(() => {
    applyFactor(normalizedInitial, "initial");
  }, [applyFactor, normalizedInitial]);

  const handleMonitorChange = useCallback(
    (api: PerformanceMonitorApi) => {
      const reason =
        api.factor >= qualityFactorRef.current ? "incline" : "decline";
      applyFactor(api.factor, reason, api);
    },
    [applyFactor],
  );

  const handleMonitorFallback = useCallback(
    (api: PerformanceMonitorApi) => {
      applyFactor(fallbackFactor, "fallback", api);
    },
    [applyFactor, fallbackFactor],
  );

  return (
    <>
      <PerformanceMonitor
        factor={normalizedInitial}
        ms={monitorWindowMs}
        iterations={monitorIterations}
        threshold={monitorThreshold}
        step={monitorStep}
        flipflops={monitorFlipflops}
        bounds={monitorBounds}
        onChange={handleMonitorChange}
        onFallback={handleMonitorFallback}
      >
        <AdaptiveDpr pixelated={pixelated} />
      </PerformanceMonitor>
      <MetricsSampler
        intervalMs={metricsIntervalMs}
        qualityFactorRef={qualityFactorRef}
        onMetricsRef={onMetricsRef}
      />
    </>
  );
}
