import { projectCoordinate } from "./campus-geometry";
import type { CampusData, Point2D } from "./types";

export const CAMPUS_LANDMARKS = {
  westGate: {
    id: "west-gate",
    label: "서문",
    latitude: 36.76938,
    longitude: 126.92763,
    rotation: 0.51,
    height: 15,
  },
  hyangseolEastGate: {
    id: "hyangseol-east-gate",
    label: "향설동문",
    latitude: 36.77314,
    longitude: 126.93348,
    // The main canopy crosses the north-east access road; the third arm opens
    // toward the campus rather than following the road centerline.
    rotation: -0.91,
    height: 13,
  },
} as const;

export function getCampusLandmarkPoint(
  landmark: (typeof CAMPUS_LANDMARKS)[keyof typeof CAMPUS_LANDMARKS],
  origin: CampusData["origin"],
): Point2D {
  return projectCoordinate(landmark.latitude, landmark.longitude, origin);
}
