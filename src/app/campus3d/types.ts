export type Point2D = [number, number];

export interface CampusBuilding {
  id: string;
  name: string;
  points: Point2D[];
  height: number;
  kind: string;
}

export interface CampusRoad {
  id: string;
  name: string | null;
  points: Point2D[];
  kind: string;
  width: number;
}

export interface CampusArea {
  id: string;
  name: string | null;
  points: Point2D[];
  kind: string;
}

export interface CampusData {
  attribution: string;
  generatedAt: string;
  origin: { lat: number; lng: number };
  boundary: Point2D[];
  buildings: CampusBuilding[];
  roads: CampusRoad[];
  areas: CampusArea[];
}

export interface CampusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

