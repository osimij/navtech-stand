// MediaPipe runs on this device. Only a normalized face position leaves this worker.
import { FaceDetector, FilesetResolver } from './vision_bundle.mjs';
let detector = null;
let previous = null;
let disposed = false;
self.onmessage = async ({ data }) => {
  if (data.type === 'dispose') {
    disposed = true;
    detector?.close(); detector = null;
    self.postMessage({ type: 'closed' });
    return;
  }
  if (data.type === 'init') {
    try {
      const files = await FilesetResolver.forVisionTasks(new URL('./wasm', self.location.href).href, true);
      const created = await FaceDetector.createFromOptions(files, {
        baseOptions: { modelAssetPath: new URL('./blaze_face_short_range.tflite', self.location.href).href, delegate: 'CPU' },
        runningMode: 'VIDEO', minDetectionConfidence: .65, minSuppressionThreshold: .3,
      });
      if (disposed) { created.close(); return; }
      detector = created;
      self.postMessage({ type: 'ready' });
    } catch { if (!disposed) self.postMessage({ type: 'error' }); }
    return;
  }
  if (data.type === 'frame') {
    const { bitmap, timestamp } = data;
    try {
      if (!detector || disposed) return;
      const faces = detector.detectForVideo(bitmap, timestamp).detections
        .filter(face => face.boundingBox)
        .map(({ boundingBox: box }) => ({ x: (box.originX + box.width / 2) / bitmap.width, y: (box.originY + box.height / 2) / bitmap.height, area: box.width * box.height }))
        .sort((a, b) => b.area - a.area);
      let chosen = faces[0];
      if (previous && faces.length > 1) {
        const nearest = [...faces].sort((a,b) => Math.hypot(a.x-previous.x,a.y-previous.y)-Math.hypot(b.x-previous.x,b.y-previous.y))[0];
        if (nearest.area >= chosen.area * .6) chosen = nearest;
      }
      previous = chosen || null;
      self.postMessage({ type: 'position', point: chosen ? { x: Math.max(-1, Math.min(1, 1-chosen.x*2)), y: Math.max(-1, Math.min(1, chosen.y*2-1)) } : null });
    } catch { self.postMessage({ type: 'error' }); }
    finally { bitmap.close(); }
  }
};
