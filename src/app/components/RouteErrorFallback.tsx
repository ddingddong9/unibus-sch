import { isRouteErrorResponse, useRouteError } from "react-router-dom";

const CHUNK_ERROR_PATTERN = /chunk|dynamically imported|failed to fetch|importing a module/i;

export function RouteErrorFallback() {
  const error = useRouteError();
  const errorMessage = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : "";
  const isChunkError = CHUNK_ERROR_PATTERN.test(errorMessage);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <section
        aria-labelledby="route-error-title"
        className="w-full max-w-sm rounded-3xl border border-unibus-divider bg-unibus-surface p-6 text-center shadow-[var(--unibus-shadow-card)]"
        role="alert"
      >
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--unibus-brand-soft)] text-xl font-black text-[var(--unibus-brand)]">
          !
        </div>
        <h1 id="route-error-title" className="mt-4 text-xl font-black text-unibus-text">
          {isChunkError ? "새 버전 화면을 불러오지 못했어요" : "페이지를 불러오지 못했어요"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-unibus-muted">
          네트워크 연결을 확인한 뒤 다시 시도해 주세요. 입력하던 정보가 있다면 먼저 확인해 주세요.
        </p>
        <div className="mt-6 grid gap-2">
          <button
            type="button"
            className="h-12 rounded-xl bg-[var(--unibus-brand)] px-4 font-bold text-[var(--unibus-brand-foreground)] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--unibus-focus)] focus-visible:ring-offset-2"
            onClick={() => window.location.reload()}
          >
            다시 불러오기
          </button>
          <a
            className="grid h-12 place-items-center rounded-xl border border-unibus-divider font-bold text-unibus-text outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-[var(--unibus-focus)] focus-visible:ring-offset-2"
            href="/home"
          >
            홈으로 이동
          </a>
        </div>
      </section>
    </main>
  );
}
