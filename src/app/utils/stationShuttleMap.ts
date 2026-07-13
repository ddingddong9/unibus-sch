interface StationMapStop {
  id: string;
  nameKo: string;
  nameEn: string;
  lat: number;
  lng: number;
  order: number;
}

const isStation = (name: string) => /신창|순천향대역|순천향대학교역/.test(name);
const isRearGate = (name: string) => /후문/.test(name);

function squaredDistance(point: [number, number], stop: StationMapStop) {
  const longitudeScale = Math.cos((stop.lat * Math.PI) / 180);
  const longitude = (point[0] - stop.lng) * longitudeScale;
  const latitude = point[1] - stop.lat;
  return longitude * longitude + latitude * latitude;
}

function nearestPathIndex(path: [number, number][], stop: StationMapStop) {
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  path.forEach((point, index) => {
    const distance = squaredDistance(point, stop);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return nearestIndex;
}

export function getStationShuttleMap(
  path: [number, number][],
  stops: StationMapStop[],
  direction: "to-station" | "from-station" = "from-station",
) {
  const orderedStops = [...stops].sort((a, b) => a.order - b.order);
  const station = orderedStops.find((stop) => isStation(stop.nameKo));
  const rearGate = orderedStops.find((stop) => isRearGate(stop.nameKo));
  if (!station || !rearGate) return { path: [], stops: [] as StationMapStop[] };
  const lounge = { ...rearGate, nameKo: "김승우 라운지", nameEn: "Kim Seung-woo Lounge" };

  const endpoints = (direction === "to-station" ? [lounge, station] : [station, lounge])
    .map((stop, index) => ({ ...stop, order: index + 1 }));
  if (path.length < 2) return { path: [], stops: endpoints };

  const firstIndex = nearestPathIndex(path, endpoints[0]);
  const secondIndex = nearestPathIndex(path, endpoints[1]);
  const start = Math.min(firstIndex, secondIndex);
  const end = Math.max(firstIndex, secondIndex);
  const segment = path.slice(start, end + 1);

  if (firstIndex > secondIndex) segment.reverse();
  return { path: segment, stops: endpoints };
}
