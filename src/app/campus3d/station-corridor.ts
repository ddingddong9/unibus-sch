import stationCorridorSource from "./station-corridor-data.json";
import type { CampusArea, CampusData, CampusRoad } from "./types";

export interface StationCorridorData extends CampusData {
  railways: CampusRoad[];
  platforms: CampusArea[];
  station: { lat: number; lng: number };
}

export const stationCorridorData = stationCorridorSource as unknown as StationCorridorData;
