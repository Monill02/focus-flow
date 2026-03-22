/** MediaPipe WASM (pin to same major as @mediapipe/tasks-vision in package.json). */
export const DOOMCAM_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

export const DOOMCAM_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/** Normalized Y of face centroid above this → likely looking down / phone. */
export const FACE_CENTROID_Y_THRESHOLD = 0.56;

/** Must hold bad posture this long before firing (ms). */
export const SUSTAINED_BAD_MS = 1600;

/** Min time between nudge triggers from doomcam (ms). */
export const COOLDOWN_MS = 10000;

/** Throttle model inference (ms). */
export const DETECTION_INTERVAL_MS = 200;

export function isDoomcamEnvEnabled(): boolean {
  return import.meta.env.VITE_DOOMCAM_ENABLED !== "false";
}
