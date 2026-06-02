import cv from '@techstark/opencv-js';

let ready: Promise<void> | null = null;

/** Initialise opencv.js (WASM). Idempotent; resolves once the runtime is ready. */
export function loadOpenCv(): Promise<void> {
  if (!ready) {
    ready = new Promise<void>((resolve) => {
      if (typeof cv.Mat === 'function') resolve();
      else cv.onRuntimeInitialized = () => resolve();
    });
  }
  return ready;
}

export type Mat = InstanceType<typeof cv.Mat>;
