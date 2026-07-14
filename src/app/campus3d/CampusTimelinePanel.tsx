import {
  Clock3,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export type CampusTimelineMode = "live" | "demo";
export type CampusTimelineSpeed = 0.5 | 1 | 2 | 5;

export interface CampusTimelinePanelProps {
  mode: CampusTimelineMode;
  isPlaying: boolean;
  currentTime: number;
  rangeStart: number;
  rangeEnd: number;
  speed: CampusTimelineSpeed;
  onModeChange: (mode: CampusTimelineMode) => void;
  onPlayingChange: (isPlaying: boolean) => void;
  onTimeChange: (time: number) => void;
  onSpeedChange: (speed: CampusTimelineSpeed) => void;
  onResetToNow: () => void;
  stepMs?: number;
  disabled?: boolean;
  className?: string;
}

const SPEEDS: readonly CampusTimelineSpeed[] = [0.5, 1, 2, 5];
const DEFAULT_STEP_MS = 60_000;

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  weekday: "short",
});

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "--:--" : timeFormatter.format(date);
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "날짜 없음" : dateFormatter.format(date);
}

export default function CampusTimelinePanel({
  mode,
  isPlaying,
  currentTime,
  rangeStart,
  rangeEnd,
  speed,
  onModeChange,
  onPlayingChange,
  onTimeChange,
  onSpeedChange,
  onResetToNow,
  stepMs = DEFAULT_STEP_MS,
  disabled = false,
  className = "",
}: CampusTimelinePanelProps) {
  const safeStart = Math.min(rangeStart, rangeEnd);
  const safeEnd = Math.max(rangeStart, rangeEnd);
  const safeTime = clamp(currentTime, safeStart, safeEnd);
  const duration = Math.max(safeEnd - safeStart, 1);
  const progress = ((safeTime - safeStart) / duration) * 100;

  return (
    <section
      aria-label="캠퍼스 운행 타임라인"
      className={`w-full rounded-lg border border-[#dbe3ee] bg-white/95 p-3 font-['Public_Sans'] text-[#0f172a] shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-4 ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="grid h-10 grid-cols-2 rounded-lg bg-[#eef2f7] p-1 sm:w-[210px]"
          role="group"
          aria-label="운행 데이터 모드"
        >
          <button
            type="button"
            aria-pressed={mode === "live"}
            disabled={disabled}
            onClick={() => onModeChange("live")}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b8a]/30 disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "live"
                ? "bg-white text-[#1e3b8a] shadow-sm"
                : "text-[#64748b] hover:text-[#1e3b8a]"
            }`}
          >
            <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            실시간
          </button>
          <button
            type="button"
            aria-pressed={mode === "demo"}
            disabled={disabled}
            onClick={() => onModeChange("demo")}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b8a]/30 disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "demo"
                ? "bg-[#1e3b8a] text-white shadow-sm"
                : "text-[#64748b] hover:text-[#1e3b8a]"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            데모
          </button>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-end">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                mode === "live"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-[#eef3ff] text-[#1e3b8a]"
              }`}
            >
              <Clock3 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold text-[#64748b]">
                {formatDate(safeTime)} · {mode === "live" ? "실시간 운행" : "시뮬레이션 시각"}
              </p>
              <time
                dateTime={new Date(safeTime).toISOString()}
                className="block tabular-nums text-lg font-extrabold leading-tight text-[#0f172a]"
              >
                {formatTime(safeTime)}
              </time>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-extrabold ${
              isPlaying
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#f1f5f9] text-[#64748b]"
            }`}
          >
            {isPlaying ? "재생 중" : "일시정지"}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 border-t border-[#e2e8f0] pt-3 sm:grid-cols-[40px_minmax(180px,1fr)_40px_auto] sm:gap-3">
        <button
          type="button"
          aria-label={isPlaying ? "타임라인 일시정지" : "타임라인 재생"}
          title={isPlaying ? "일시정지" : "재생"}
          disabled={disabled}
          onClick={() => onPlayingChange(!isPlaying)}
          className="grid h-10 w-10 place-items-center rounded-lg bg-[#1e3b8a] text-white shadow-sm transition-colors hover:bg-[#182f70] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b8a]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />
          )}
        </button>

        <div className="min-w-0">
          <input
            type="range"
            aria-label="시뮬레이션 시각"
            aria-valuetext={`${formatDate(safeTime)} ${formatTime(safeTime)}`}
            min={safeStart}
            max={safeEnd}
            step={Math.max(stepMs, 1)}
            value={safeTime}
            disabled={disabled || safeStart === safeEnd}
            onChange={(event) => onTimeChange(Number(event.currentTarget.value))}
            className="h-5 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-[#1e3b8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b8a]/25 disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[#1e3b8a] [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#1e3b8a] [&::-webkit-slider-thumb]:shadow-md"
            style={{
              background: `linear-gradient(to right, #1e3b8a 0%, #1e3b8a ${progress}%, #dbe3ee ${progress}%, #dbe3ee 100%) center / 100% 6px no-repeat`,
            }}
          />
          <div className="mt-0.5 flex justify-between text-[9px] font-semibold tabular-nums text-[#94a3b8]">
            <span>{formatTime(safeStart)}</span>
            <span>{formatTime(safeEnd)}</span>
          </div>
        </div>

        <button
          type="button"
          aria-label="현재 시각으로 초기화"
          title="현재 시각으로"
          disabled={disabled}
          onClick={onResetToNow}
          className="grid h-10 w-10 place-items-center rounded-lg border border-[#cbd5e1] bg-white text-[#64748b] transition-colors hover:border-[#1e3b8a]/30 hover:bg-[#eef3ff] hover:text-[#1e3b8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b8a]/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>

        <div
          className="col-span-3 grid h-9 grid-cols-4 rounded-lg bg-[#eef2f7] p-1 sm:col-span-1 sm:w-[184px]"
          role="group"
          aria-label="재생 속도"
        >
          {SPEEDS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={speed === option}
              disabled={disabled}
              onClick={() => onSpeedChange(option)}
              className={`rounded-md px-2 text-[10px] font-extrabold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b8a]/30 disabled:cursor-not-allowed disabled:opacity-50 ${
                speed === option
                  ? "bg-white text-[#1e3b8a] shadow-sm"
                  : "text-[#64748b] hover:text-[#1e3b8a]"
              }`}
            >
              {option}x
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
