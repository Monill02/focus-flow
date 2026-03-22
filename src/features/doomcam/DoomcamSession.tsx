import { useEffect, useRef } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import {
  COOLDOWN_MS,
  DETECTION_INTERVAL_MS,
  DOOMCAM_MODEL_URL,
  DOOMCAM_WASM_BASE,
  SUSTAINED_BAD_MS,
} from "./config";
import { isLookingDownHeuristic } from "./posture";

export type DoomcamStatus =
  | "off"
  | "starting"
  | "active"
  | "denied"
  | "unavailable"
  | "error";

type Props = {
  /** Session is live on Cockpit */
  active: boolean;
  /** User enabled posture / doomscroll defense in Settings */
  enabled: boolean;
  /** Kill switch from env */
  envEnabled: boolean;
  onPostureBad: () => void;
  onStatus?: (status: DoomcamStatus, detail?: string) => void;
};

/**
 * Starts webcam + Face Landmarker when `active && enabled && envEnabled`, runs doomscroll heuristic, calls `onPostureBad` when sustained bad posture detected.
 */
export default function DoomcamSession({
  active,
  enabled,
  envEnabled,
  onPostureBad,
  onStatus,
}: Props) {
  const onPostureBadRef = useRef(onPostureBad);
  onPostureBadRef.current = onPostureBad;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  useEffect(() => {
    const notify = (s: DoomcamStatus, detail?: string) => {
      onStatusRef.current?.(s, detail);
    };

    if (!active || !enabled || !envEnabled) {
      notify("off");
      return;
    }

    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let landmarker: FaceLandmarker | null = null;

    const video = document.createElement("video");
    video.setAttribute("playsinline", "true");
    video.muted = true;
    video.width = 480;
    video.height = 360;

    let lastDetect = 0;
    let badSince: number | null = null;
    let lastFire = 0;

    const loop = () => {
      if (cancelled) return;
      raf = requestAnimationFrame(loop);

      if (!video.srcObject || video.readyState < 2) return;

      const now = performance.now();
      if (now - lastDetect < DETECTION_INTERVAL_MS) return;
      lastDetect = now;

      if (!landmarker) return;

      try {
        const result = landmarker.detectForVideo(video, now);
        const lm = result.faceLandmarks?.[0];
        const bad = isLookingDownHeuristic(lm);

        if (!bad) {
          badSince = null;
          return;
        }

        if (badSince === null) {
          badSince = now;
          return;
        }

        if (
          now - badSince >= SUSTAINED_BAD_MS &&
          now - lastFire >= COOLDOWN_MS
        ) {
          lastFire = now;
          badSince = null;
          onPostureBadRef.current();
        }
      } catch {
        // single frame failure — ignore
      }
    };

    (async () => {
      try {
        notify("starting");

        if (!navigator.mediaDevices?.getUserMedia) {
          notify("unavailable", "Camera API not available");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        video.srcObject = stream;
        await video.play();

        const { FaceLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );

        const fileset = await FilesetResolver.forVisionTasks(DOOMCAM_WASM_BASE);

        let created: InstanceType<typeof FaceLandmarker> | null = null;
        try {
          created = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: DOOMCAM_MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        } catch {
          created = await FaceLandmarker.createFromOptions(fileset, {
            baseOptions: {
              modelAssetPath: DOOMCAM_MODEL_URL,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        if (cancelled) {
          created?.close();
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        landmarker = created;
        notify("active");
        raf = requestAnimationFrame(loop);
      } catch (e) {
        const name = e instanceof DOMException ? e.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          notify("denied", "Camera permission denied");
        } else {
          notify(
            "error",
            e instanceof Error ? e.message : "Failed to start posture defense",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      landmarker?.close();
      landmarker = null;
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      video.srcObject = null;
      notify("off");
    };
  }, [active, enabled, envEnabled]);

  return null;
}
