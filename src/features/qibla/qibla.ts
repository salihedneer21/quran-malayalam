const KAABA = {
  latitude: 21.422487,
  longitude: 39.826206,
};

function deg2rad(deg: number) {
  return (deg * Math.PI) / 180;
}

function rad2deg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function normalizeAngle360(deg: number) {
  return ((deg % 360) + 360) % 360;
}

export function normalizeAngle180(deg: number) {
  const a = normalizeAngle360(deg);
  return a > 180 ? a - 360 : a;
}

/**
 * Returns initial bearing (0–360) to Kaaba from the given coordinates.
 */
export function qiblaBearing(latitude: number, longitude: number): number {
  const φ = deg2rad(latitude);
  const λ = deg2rad(longitude);
  const φK = deg2rad(KAABA.latitude);
  const λK = deg2rad(KAABA.longitude);

  const Δλ = λK - λ;
  const y = Math.sin(Δλ);
  const x = Math.cos(φ) * Math.tan(φK) - Math.sin(φ) * Math.cos(Δλ);

  return normalizeAngle360(rad2deg(Math.atan2(y, x)));
}

