import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { FACE_CENTROID_Y_THRESHOLD } from "./config";

/**
 * Heuristic: average landmark Y in normalized image space.
 * When the user looks down at a phone, the face cluster tends to sit lower (higher Y).
 */
export function faceCentroidY(landmarks: NormalizedLandmark[]): number {
  let sy = 0;
  for (const lm of landmarks) {
    sy += lm.y;
  }
  return sy / landmarks.length;
}

export function isLookingDownHeuristic(
  landmarks: NormalizedLandmark[] | undefined,
  thresholdY = FACE_CENTROID_Y_THRESHOLD,
): boolean {
  if (!landmarks?.length) return false;
  return faceCentroidY(landmarks) > thresholdY;
}
