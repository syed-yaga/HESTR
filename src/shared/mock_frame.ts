/**
 * Mock Camera Frame for Rover Front Hazard Camera (640x360)
 * Compliant with PRD Section 3.3 multimodal_snapshot requirements.
 */

// Valid Base64-encoded JPEG image for API payloads (Gemini API & DO Serverless)
export const MOCK_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAALCAABAAEBAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/9oACAEBAAA/AH8A/9k=';

// High-definition SVG HUD camera snapshot for the live auditorium judging UI
export const MOCK_CAMERA_HUD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360" style="background:#090d16;font-family:monospace;">
  <!-- Road perspective -->
  <polygon points="120,360 520,360 370,180 270,180" fill="#141923" />
  <line x1="320" y1="180" x2="320" y2="360" stroke="#f59e0b" stroke-dasharray="16,12" stroke-width="4" />
  <!-- Horizon & Terrain -->
  <rect x="0" y="0" width="640" height="180" fill="#0b1120" />
  <line x1="0" y1="180" x2="640" y2="180" stroke="#1e293b" stroke-width="2" />
  <!-- Campus Gate 2 Boundary Posts -->
  <rect x="180" y="140" width="24" height="40" fill="#334155" />
  <rect x="436" y="140" width="24" height="40" fill="#334155" />
  <text x="175" y="132" fill="#64748b" font-size="10">GATE 2 PILLAR L</text>
  <text x="430" y="132" fill="#64748b" font-size="10">GATE 2 PILLAR R</text>
  
  <!-- Road Hazard Object (Debris / Pothole / Curb drop) -->
  <ellipse cx="320" cy="275" rx="55" ry="18" fill="#ef4444" opacity="0.3" />
  <ellipse cx="320" cy="275" rx="42" ry="12" fill="#dc2626" opacity="0.7" />
  
  <!-- AI Object Detection Box -->
  <rect x="250" y="240" width="140" height="70" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,2" />
  <rect x="250" y="222" width="140" height="18" fill="#ef4444" />
  <text x="255" y="235" fill="#ffffff" font-size="11" font-weight="bold">HAZARD: 3.42g SPIKE</text>
  
  <!-- Camera HUD Overlays -->
  <text x="20" y="30" fill="#22c55e" font-size="13" font-weight="bold">● REC [ROVER-04 FRONT_HAZARD_CAM]</text>
  <text x="20" y="50" fill="#94a3b8" font-size="11">RES: 640x360 | FPS: 30 (1 FPS BUFFER)</text>
  <text x="20" y="70" fill="#f87171" font-size="11">TRIGGER: GATEKEEPER ESCALATION</text>
  
  <text x="440" y="30" fill="#38bdf8" font-size="12">LAT: 28.6542° N</text>
  <text x="440" y="48" fill="#38bdf8" font-size="12">LNG: 77.3025° E</text>
  <text x="440" y="66" fill="#fbbf24" font-size="12">GEOFENCE: GATE_2_EXIT</text>
  
  <!-- Reticle -->
  <circle cx="320" cy="180" r="16" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.5" />
  <line x1="300" y1="180" x2="340" y2="180" stroke="#38bdf8" stroke-width="1" opacity="0.5" />
  <line x1="320" y1="160" x2="320" y2="200" stroke="#38bdf8" stroke-width="1" opacity="0.5" />
</svg>
`.trim();

export const MOCK_CAMERA_FRAME_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(MOCK_CAMERA_HUD_SVG)}`;

export function getMockMultimodalSnapshot(mimeType = 'image/jpeg') {
  return {
    mime_type: mimeType,
    base64_data: MOCK_JPEG_BASE64,
    capture_source: 'front_hazard_cam_640x360',
    display_data_uri: MOCK_CAMERA_FRAME_DATA_URI
  };
}
