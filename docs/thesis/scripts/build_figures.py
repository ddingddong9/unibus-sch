from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[3]
THESIS = ROOT / "docs" / "thesis"
SCREENSHOTS = THESIS / "screenshots"
OUTPUT = THESIS / "figures"
OUTPUT.mkdir(parents=True, exist_ok=True)

FONT_SANS = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_SERIF = "/System/Library/Fonts/Supplemental/AppleMyungjo.ttf"

NAVY = "#425466"
NAVY_2 = "#425466"
BLUE = "#425466"
SKY = "#E9EDF0"
TEAL = "#425466"
GREEN = "#425466"
RED = "#425466"
INK = "#202428"
MUTED = "#60666C"
LINE = "#A7ADB2"
PAPER = "#FFFFFF"
PANEL = "#F5F6F7"
SOFT = "#E2E5E8"
HAIRLINE = "#D7DADD"


def font(size: int, bold: bool = False, serif: bool = False) -> ImageFont.FreeTypeFont:
    path = FONT_SERIF if serif else FONT_SANS
    index = 0 if not bold else 1
    try:
        return ImageFont.truetype(path, size=size, index=index)
    except OSError:
        return ImageFont.truetype(path, size=size)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        current = ""
        for char in paragraph:
            candidate = current + char
            if current and draw.textbbox((0, 0), candidate, font=fnt)[2] > width:
                lines.append(current)
                current = char
            else:
                current = candidate
        if current:
            lines.append(current)
    return lines


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    text: str,
    fnt: ImageFont.FreeTypeFont,
    fill: str = INK,
    spacing: int = 8,
) -> None:
    x1, y1, x2, y2 = box
    lines = wrap_text(draw, text, fnt, x2 - x1 - 28)
    heights = [draw.textbbox((0, 0), line or " ", font=fnt)[3] for line in lines]
    total = sum(heights) + spacing * max(0, len(lines) - 1)
    y = y1 + (y2 - y1 - total) / 2
    for line, h in zip(lines, heights):
        bbox = draw.textbbox((0, 0), line, font=fnt)
        x = x1 + (x2 - x1 - (bbox[2] - bbox[0])) / 2
        draw.text((x, y), line, font=fnt, fill=fill)
        y += h + spacing


def rounded_box(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    title: str,
    body: str,
    accent: str,
    fill: str = PAPER,
) -> None:
    # Academic diagrams use a restrained, print-safe box system instead of UI cards.
    draw.rectangle(box, fill=PAPER, outline=LINE, width=2)
    x1, y1, x2, _ = box
    draw.line((x1, y1, x2, y1), fill=NAVY, width=6)
    draw_centered_text(draw, (x1, y1 + 4, x2, y1 + 60), title, font(23, True), INK)
    draw.line((x1 + 18, y1 + 62, x2 - 18, y1 + 62), fill=HAIRLINE, width=2)
    draw_centered_text(draw, (x1 + 10, y1 + 66, x2 - 10, box[3] - 8), body, font(19), INK, 6)


def arrow(
    draw: ImageDraw.ImageDraw,
    start: tuple[int, int],
    end: tuple[int, int],
    color: str = NAVY,
    width: int = 4,
) -> None:
    draw.line((start, end), fill=color, width=width)
    x1, y1 = start
    x2, y2 = end
    dx, dy = x2 - x1, y2 - y1
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    size = 15
    base_x, base_y = x2 - ux * size, y2 - uy * size
    points = [
        (x2, y2),
        (base_x + px * size * 0.55, base_y + py * size * 0.55),
        (base_x - px * size * 0.55, base_y - py * size * 0.55),
    ]
    draw.polygon(points, fill=color)


def title(draw: ImageDraw.ImageDraw, text: str, subtitle: str = "") -> None:
    draw.text((70, 45), text, font=font(36, True), fill=INK)
    if subtitle:
        draw.text((72, 97), subtitle, font=font(20), fill=MUTED)
    draw.line((70, 142, 1930, 142), fill=NAVY, width=2)


def build_architecture() -> None:
    image = Image.new("RGB", (2000, 1260), PAPER)
    draw = ImageDraw.Draw(image)
    title(draw, "UNIBUS 시스템 아키텍처", "역할별 클라이언트, 애플리케이션 서비스, 데이터 계층의 연결")

    client_boxes = [
        ((80, 220, 370, 410), "사용자 PWA", "홈 · 학내순환\n신창역 셔틀 · 통학버스"),
        ((80, 510, 370, 700), "관리자 웹", "노선 · 정류장 · 버스\n사용자 · 공지 · 알림"),
        ((80, 800, 370, 990), "기사 PWA", "배차 확인 · 운행 상태\n위치 자동 송신"),
    ]
    for box, heading, body in client_boxes:
        rounded_box(draw, box, heading, body, NAVY_2)

    rounded_box(
        draw,
        (520, 200, 1050, 1010),
        "React 19 + Vite PWA",
        "라우터·21개 지연 로딩 화면\n\n인증·역할별 보호 라우트\n\nNAVER 지도 2D\n\nReact Three Fiber 3D\n\n시간표·ETA·경로 시뮬레이션\n\nService Worker·Web Manifest",
        NAVY,
        PAPER,
    )
    rounded_box(
        draw,
        (1190, 200, 1710, 700),
        "Supabase Edge Function",
        "Hono HTTP API\n\n인증·역할 미들웨어\n\n노선·버스·기사 API\n\n공지·사용자·푸시 API\n\nCORS 허용 목록\n\n경로 저장 RPC 호출",
        TEAL,
        PAPER,
    )
    rounded_box(
        draw,
        (1190, 790, 1710, 1120),
        "PostgreSQL + Realtime",
        "12개 테이블 · 18개 마이그레이션\nRLS 역할 정책\n최신 위치 + 30초 이력 표본\n버스 운행 세션·경로 캐시",
        GREEN,
        PAPER,
    )

    rounded_box(draw, (1790, 230, 1940, 420), "지도", "NAVER\nMaps API", BLUE)
    rounded_box(draw, (1790, 520, 1940, 710), "인증", "Kakao\nOAuth", BLUE)
    rounded_box(draw, (1790, 810, 1940, 1000), "알림", "Web Push\nService", BLUE)

    for y in (315, 605, 895):
        arrow(draw, (370, y), (520, y))
    arrow(draw, (1050, 450), (1190, 450))
    arrow(draw, (1450, 700), (1450, 790))
    arrow(draw, (1710, 325), (1790, 325))
    arrow(draw, (1710, 615), (1790, 615))
    arrow(draw, (1710, 905), (1790, 905))
    arrow(draw, (1190, 940), (1050, 940))

    draw.text((80, 1145), "권한 경계", font=font(20, True), fill=INK)
    draw.line((195, 1160, 480, 1160), fill=NAVY, width=3)
    draw.text((505, 1145), "HTTPS/API", font=font(20), fill=MUTED)
    draw.text((755, 1145), "RLS·서버 역할 검사", font=font(20), fill=MUTED)
    draw.text((1120, 1145), "공개 조회와 관리 쓰기 분리", font=font(20), fill=MUTED)
    image.save(OUTPUT / "system_architecture.png", dpi=(300, 300))


def entity_box(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    name: str,
    fields: Iterable[str],
    accent: str,
) -> None:
    x1, y1, x2, y2 = box
    draw.rectangle(box, fill=PAPER, outline=LINE, width=2)
    draw.line((x1, y1, x2, y1), fill=NAVY, width=5)
    draw.rectangle((x1 + 2, y1 + 3, x2 - 2, y1 + 44), fill=PANEL)
    draw_centered_text(draw, (x1, y1 + 3, x2, y1 + 44), name, font(19, True), INK)
    y = y1 + 56
    for field in fields:
        draw.text((x1 + 14, y), field, font=font(15), fill=INK)
        y += 25


def connector(draw: ImageDraw.ImageDraw, a: tuple[int, int], b: tuple[int, int], label: str = "") -> None:
    draw.line((a, b), fill=LINE, width=3)
    draw.ellipse((a[0] - 4, a[1] - 4, a[0] + 4, a[1] + 4), fill=INK)
    arrow(draw, a, b, LINE, 3)
    if label:
        mx, my = (a[0] + b[0]) // 2, (a[1] + b[1]) // 2
        bbox = draw.textbbox((0, 0), label, font=font(14, True))
        draw.rectangle((mx - 6, my - 5, mx + bbox[2] + 7, my + bbox[3] + 4), fill=PAPER)
        draw.text((mx, my), label, font=font(14, True), fill=MUTED)


def build_data_model() -> None:
    image = Image.new("RGB", (2000, 1320), PAPER)
    draw = ImageDraw.Draw(image)
    title(draw, "UNIBUS 핵심 데이터 모델", "12개 관계형 테이블과 실시간 위치 저장 구조")

    boxes = {
        "users": (60, 210, 340, 390),
        "auth_tokens": (60, 480, 340, 635),
        "push_subscriptions": (60, 735, 340, 915),
        "notices": (60, 1010, 340, 1185),
        "routes": (670, 200, 990, 430),
        "route_stops": (450, 560, 730, 735),
        "route_shape_points": (820, 560, 1120, 760),
        "route_path_cache": (1170, 230, 1460, 405),
        "buses": (1570, 200, 1900, 450),
        "bus_trips": (1260, 560, 1560, 810),
        "bus_latest_state": (1640, 590, 1940, 790),
        "bus_locations": (1640, 960, 1940, 1160),
    }
    entity_box(draw, boxes["users"], "users", ["PK id", "email · name", "role · provider"], NAVY)
    entity_box(draw, boxes["auth_tokens"], "auth_tokens", ["FK user_id", "token hash", "expires_at"], NAVY)
    entity_box(draw, boxes["push_subscriptions"], "push_subscriptions", ["FK user_id", "endpoint", "p256dh · auth"], NAVY)
    entity_box(draw, boxes["notices"], "notices", ["FK author_id", "category · priority", "content · image_urls"], NAVY)
    entity_box(draw, boxes["routes"], "routes", ["PK id", "type · shuttle_variant", "schedule_basis", "interval · offsets", "continuation_route_id"], TEAL)
    entity_box(draw, boxes["route_stops"], "route_stops", ["FK route_id", "stop_order", "latitude · longitude"], TEAL)
    entity_box(draw, boxes["route_shape_points"], "route_shape_points", ["FK route_id", "after_stop_order", "point_order · 좌표"], TEAL)
    entity_box(draw, boxes["route_path_cache"], "route_path_cache", ["PK/FK route_id", "input_hash", "path JSONB"], TEAL)
    entity_box(draw, boxes["buses"], "buses", ["PK id", "current_route_id", "assigned_driver_id", "status · is_running"], GREEN)
    entity_box(draw, boxes["bus_trips"], "bus_trips", ["FK bus · route · driver", "status · service_phase", "planned_departure_at", "current_stop_order"], GREEN)
    entity_box(draw, boxes["bus_latest_state"], "bus_latest_state", ["PK/FK bus_id", "FK trip_id", "좌표 · 속도 · 방향", "timestamp"], GREEN)
    entity_box(draw, boxes["bus_locations"], "bus_locations", ["FK bus_id", "좌표 · 속도 · 방향", "timestamp", "30초 표본 이력"], GREEN)

    connector(draw, (340, 300), (1570, 300), "기사 배정")
    connector(draw, (200, 390), (200, 480), "1:N")
    connector(draw, (260, 390), (260, 735), "1:N")
    connector(draw, (120, 390), (120, 1010), "작성자")
    connector(draw, (990, 310), (1570, 365), "현재 노선")
    connector(draw, (760, 430), (590, 560), "1:N")
    connector(draw, (900, 430), (970, 560), "1:N")
    connector(draw, (990, 260), (1170, 300), "1:1")
    connector(draw, (1730, 450), (1440, 560), "1:N")
    connector(draw, (1810, 450), (1790, 590), "1:1")
    connector(draw, (1830, 790), (1830, 960), "표본화")
    connector(draw, (1560, 680), (1640, 680), "활성 상태")
    connector(draw, (990, 400), (1370, 560), "운행 노선")

    draw.rectangle((420, 1050, 1510, 1195), fill=PANEL, outline=LINE, width=2)
    draw.text((450, 1075), "저장 전략", font=font(22, True), fill=INK)
    draw.text((450, 1118), "최신 위치는 bus_latest_state에 덮어쓰고, 30초 간격 표본만 bus_locations에 누적한다.", font=font(18), fill=MUTED)
    draw.text((450, 1155), "RLS는 공개 조회 데이터와 관리자·기사 쓰기 경로를 분리한다.", font=font(18), fill=MUTED)
    image.save(OUTPUT / "data_model.png", dpi=(300, 300))


def step_box(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    number: str,
    heading: str,
    body: str,
    accent: str,
) -> None:
    draw.rectangle(box, fill=PAPER, outline=LINE, width=2)
    x1, y1, x2, y2 = box
    draw.ellipse((x1 + 24, y1 + 22, x1 + 82, y1 + 80), fill=PAPER, outline=NAVY, width=3)
    draw_centered_text(draw, (x1 + 24, y1 + 22, x1 + 82, y1 + 80), number, font(22, True), NAVY)
    draw.text((x1 + 105, y1 + 24), heading, font=font(24, True), fill=INK)
    lines = wrap_text(draw, body, font(18), x2 - x1 - 135)
    y = y1 + 65
    for line in lines:
        draw.text((x1 + 105, y), line, font=font(18), fill=MUTED)
        y += 28


def build_operation_flow() -> None:
    image = Image.new("RGB", (2000, 1220), PAPER)
    draw = ImageDraw.Draw(image)
    title(draw, "노선 편집과 실시간 운행 정보 흐름", "관리자 설정부터 사용자 2D/3D 표시까지 동일한 데이터 계약을 사용")
    steps = [
        ((90, 220, 850, 390), "1", "관리자 노선 편집", "지도에서 정류장·경로 보정점을 이동하고 노선별 운행 규칙을 설정", NAVY),
        ((90, 510, 850, 680), "2", "원자적 저장", "replace_route_details RPC가 정류장·경로점을 한 트랜잭션에서 교체", TEAL),
        ((90, 800, 850, 970), "3", "차량 상태 수집", "배정된 차량 단말이 위치를 송신하고 서버가 기사·운행 권한을 확인", GREEN),
        ((1150, 220, 1910, 390), "4", "최신·이력 분리", "최신 상태는 즉시 갱신하고 이력은 30초 간격으로 표본화", GREEN),
        ((1150, 510, 1910, 680), "5", "시간표·ETA 계산", "10분 간격, 열차 출발 10분 전, 도착 5분 후 규칙과 경로 진행률 결합", TEAL),
        ((1150, 800, 1910, 970), "6", "사용자 동기 표시", "동일 정류장·노선·버스 상태를 NAVER 2D와 캠퍼스 3D에서 표현", NAVY),
    ]
    for args in steps:
        step_box(draw, *args)
    arrow(draw, (470, 390), (470, 510))
    arrow(draw, (470, 680), (470, 800))
    arrow(draw, (850, 885), (1150, 305))
    arrow(draw, (1530, 390), (1530, 510))
    arrow(draw, (1530, 680), (1530, 800))
    draw.rectangle((620, 1035, 1380, 1135), fill=PANEL, outline=LINE, width=2)
    draw_centered_text(
        draw,
        (630, 1045, 1370, 1125),
        "기사의 운전 중 조작은 요구하지 않고, 자동 위치 송신과 관리자 사전 설정을 중심으로 설계",
        font(20, True),
        NAVY,
    )
    image.save(OUTPUT / "operation_flow.png", dpi=(300, 300))


def bar(
    draw: ImageDraw.ImageDraw,
    origin: tuple[int, int],
    value: float,
    maximum: float,
    width: int,
    height: int,
    color: str,
    label: str,
    value_text: str,
) -> None:
    x, y = origin
    draw.text((x, y - 34), label, font=font(18, True), fill=INK)
    draw.rectangle((x, y, x + width, y + height), fill=SOFT)
    filled = max(2, int(width * value / maximum))
    draw.rectangle((x, y, x + filled, y + height), fill=NAVY)
    draw.text((x + width + 16, y - 2), value_text, font=font(19, True), fill=INK)


def build_evaluation_dashboard() -> None:
    image = Image.new("RGB", (2000, 1250), PAPER)
    draw = ImageDraw.Draw(image)
    title(draw, "프로토타입 정량 평가 요약", "2026-07-15, production build와 Lighthouse 기본 모바일 시뮬레이션")
    metrics = [
        ("21 / 21", "알고리즘 시험 통과"),
        ("0", "TypeScript·ESLint 오류"),
        ("0", "npm 알려진 취약점"),
        ("18 / 18", "로컬·원격 마이그레이션"),
    ]
    draw.line((70, 190, 1930, 190), fill=INK, width=3)
    draw.line((70, 360, 1930, 360), fill=INK, width=3)
    for idx, (value, label) in enumerate(metrics):
        x1 = 70 + idx * 465
        if idx:
            draw.line((x1, 215, x1, 335), fill=HAIRLINE, width=2)
        draw.text((x1 + 28, 218), value, font=font(43, True), fill=INK)
        draw.text((x1 + 28, 300), label, font=font(19), fill=MUTED)

    draw.text((80, 440), "Lighthouse 중앙값", font=font(28, True), fill=INK)
    bar(draw, (80, 510), 79, 100, 620, 24, NAVY, "온보딩 Performance", "79")
    bar(draw, (80, 620), 73, 100, 620, 24, NAVY, "독립 3D Performance", "73")
    bar(draw, (80, 730), 3.903, 6, 620, 24, NAVY, "온보딩 LCP", "3.903 s")
    bar(draw, (80, 840), 4.654, 6, 620, 24, NAVY, "독립 3D LCP", "4.654 s")
    draw.text((80, 930), "두 경로 모두 Accessibility 100 · Best Practices 100 · TBT 0 ms · CLS 0", font=font(20), fill=MUTED)

    draw.text((1030, 440), "주요 gzip 청크", font=font(28, True), fill=INK)
    chunks = [
        ("campus-3d-vendor", 256.47, NAVY),
        ("react-vendor", 81.31, NAVY),
        ("Campus3DScene", 59.66, NAVY),
        ("supabase", 54.96, NAVY),
        ("motion-vendor", 37.78, NAVY),
    ]
    for idx, (label, value, color) in enumerate(chunks):
        bar(draw, (1030, 510 + idx * 105), value, 280, 680, 24, color, label, f"{value:.2f} kB")

    draw.line((70, 1045, 1930, 1045), fill=LINE, width=2)
    draw.text((80, 1070), "주:", font=font(19, True), fill=INK)
    draw.text(
        (125, 1070),
        "공개 경로 2개를 5회 측정한 사례 결과이며, 실제 사용자 장치의 체감 성능이나 ETA 정확도를 대표하지 않는다.",
        font=font(18),
        fill=MUTED,
    )
    image.save(OUTPUT / "evaluation_dashboard.png", dpi=(300, 300))


def fit_image(path: Path, size: tuple[int, int], background: str = PANEL) -> Image.Image:
    img = Image.open(path).convert("RGB")
    return ImageOps.pad(img, size, method=Image.Resampling.LANCZOS, color=background, centering=(0.5, 0.5))


def build_mobile_screens() -> None:
    items = [
        ("home.jpg", "(a) 홈"),
        ("campus_shuttle_3d.jpg", "(b) 학내순환 3D"),
        ("station_shuttle_3d.jpg", "(c) 신창역 셔틀 3D"),
        ("commuter_bus.jpg", "(d) 통학버스"),
    ]
    image = Image.new("RGB", (2000, 1200), PAPER)
    draw = ImageDraw.Draw(image)
    frame_w, frame_h = 420, 910
    gap = 55
    start_x = (2000 - (frame_w * 4 + gap * 3)) // 2
    for idx, (name, label) in enumerate(items):
        x = start_x + idx * (frame_w + gap)
        screen = fit_image(SCREENSHOTS / name, (frame_w, frame_h), PAPER)
        image.paste(screen, (x, 90))
        draw.rectangle((x - 3, 87, x + frame_w + 3, 1003), outline=LINE, width=3)
        bbox = draw.textbbox((0, 0), label, font=font(23, True))
        draw.text((x + (frame_w - bbox[2]) / 2, 1040), label, font=font(23, True), fill=INK)
    image.save(OUTPUT / "user_mobile_screens.png", dpi=(300, 300))


def build_admin_screens() -> None:
    image = Image.new("RGB", (2000, 1020), PAPER)
    draw = ImageDraw.Draw(image)
    items = [
        ("admin_dashboard.jpg", "(a) 관리자 대시보드"),
        ("admin_routes.jpg", "(b) 노선·정류장 관리"),
    ]
    for idx, (name, label) in enumerate(items):
        x = 60 + idx * 970
        screen = fit_image(SCREENSHOTS / name, (910, 640), PAPER)
        image.paste(screen, (x, 100))
        draw.rectangle((x - 2, 98, x + 912, 742), outline=LINE, width=3)
        bbox = draw.textbbox((0, 0), label, font=font(24, True))
        draw.text((x + (910 - bbox[2]) / 2, 780), label, font=font(24, True), fill=INK)
    draw.line((420, 865, 1580, 865), fill=LINE, width=2)
    draw_centered_text(draw, (430, 875, 1570, 945), "동일한 노선·정류장 데이터가 사용자 2D/3D 화면과 관리자 편집기에 연결된다.", font(21), MUTED)
    image.save(OUTPUT / "admin_screens.png", dpi=(300, 300))


def build_role_screens() -> None:
    items = [
        ("driver_home.jpg", "기사 배차·운행 화면"),
        ("notices.jpg", "공지·운행 안내"),
    ]
    image = Image.new("RGB", (1200, 1200), PAPER)
    draw = ImageDraw.Draw(image)
    for idx, (name, label) in enumerate(items):
        x = 120 + idx * 530
        screen = fit_image(SCREENSHOTS / name, (430, 932), PAPER)
        image.paste(screen, (x, 70))
        draw.rectangle((x - 3, 67, x + 433, 1005), outline=LINE, width=3)
        bbox = draw.textbbox((0, 0), label, font=font(23, True))
        draw.text((x + (430 - bbox[2]) / 2, 1045), label, font=font(23, True), fill=INK)
    image.save(OUTPUT / "role_screens.png", dpi=(300, 300))


def build_onboarding() -> None:
    source = Image.open(SCREENSHOTS / "onboarding_full.jpg").convert("RGB")
    image = ImageOps.pad(source, (1800, 1012), method=Image.Resampling.LANCZOS, color=PAPER)
    canvas = Image.new("RGB", (1900, 1150), PAPER)
    canvas.paste(image, (50, 30))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((47, 27, 1853, 1045), outline=LINE, width=3)
    label = "사용자 중심 단일 스크롤 온보딩 화면"
    bbox = draw.textbbox((0, 0), label, font=font(25, True))
    draw.text(((1900 - bbox[2]) / 2, 1080), label, font=font(25, True), fill=INK)
    canvas.save(OUTPUT / "onboarding_screen.png", dpi=(300, 300))


def build_contact_sheet() -> None:
    files = sorted(SCREENSHOTS.glob("*.jpg"))
    thumbs: list[tuple[Image.Image, str]] = []
    for path in files:
        thumbs.append((fit_image(path, (320, 230), PANEL), path.stem))
    cols = 3
    rows = (len(thumbs) + cols - 1) // cols
    canvas = Image.new("RGB", (1100, rows * 310 + 50), PAPER)
    draw = ImageDraw.Draw(canvas)
    for idx, (thumb, label) in enumerate(thumbs):
        x = 45 + (idx % cols) * 350
        y = 30 + (idx // cols) * 310
        canvas.paste(thumb, (x, y))
        draw.rectangle((x - 1, y - 1, x + 321, y + 231), outline=LINE, width=2)
        draw.text((x, y + 245), label, font=font(17), fill=INK)
    canvas.save(OUTPUT / "_contact_sheet.jpg", quality=90)


def main() -> None:
    build_architecture()
    build_data_model()
    build_operation_flow()
    build_evaluation_dashboard()
    build_mobile_screens()
    build_admin_screens()
    build_role_screens()
    build_onboarding()
    build_contact_sheet()
    print(f"Generated figures in {OUTPUT}")


if __name__ == "__main__":
    main()
