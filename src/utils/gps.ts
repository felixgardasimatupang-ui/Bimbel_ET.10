export interface GpsLocation {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
  address?: string;
  source: 'gps' | 'ip' | 'default';
}

function getEnvNumber(key: string, fallback: number): number {
  const val = import.meta.env[key];
  return val ? parseFloat(val) : fallback;
}

export const GPS_DEFAULT: GpsLocation = {
  lat: getEnvNumber('VITE_GPS_LAT', -6.2088),
  lon: getEnvNumber('VITE_GPS_LON', 106.8456),
  accuracy: 0,
  timestamp: Date.now(),
  address: 'HQ Bimbel Jakarta (Default)',
  source: 'default',
};

const GPS_TIMEOUT = 15000;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocode(lat: number, lon: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=id`,
      { headers: { 'User-Agent': 'EduAdminBimbel/1.0' } },
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    const a = data.address || {};
    const parts = [a.road, a.suburb, a.city || a.town || a.county, a.state].filter(Boolean);
    return parts.join(', ') || data.display_name?.split(',')?.slice(0, 3)?.join(',');
  } catch {
    return undefined;
  }
}

async function ipGeolocation(): Promise<GpsLocation | null> {
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,lat,lon,city,regionName,country', { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'success') return null;
    return {
      lat: data.lat,
      lon: data.lon,
      accuracy: 1000,
      timestamp: Date.now(),
      address: `${data.city}, ${data.regionName}, ${data.country}`,
      source: 'ip',
    };
  } catch {
    return null;
  }
}

function getUserAgentAccuracy(): number {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 10;
  if (/Android/.test(ua)) return 15;
  if (/Mac|Windows|Linux/.test(ua)) return 30;
  return 50;
}

export async function getAccurateLocation(
  onUpdate?: (loc: GpsLocation) => void,
): Promise<GpsLocation> {
  // Try native GPS first
  if (navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: GPS_TIMEOUT,
          maximumAge: 30000,
        });
      });

      const accuracy = Math.max(pos.coords.accuracy, getUserAgentAccuracy());
      const loc: GpsLocation = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: Math.round(accuracy),
        timestamp: pos.timestamp,
        source: 'gps',
      };

      onUpdate?.(loc);

      // Attempt reverse geocode in background
      loc.address = await reverseGeocode(loc.lat, loc.lon);
      onUpdate?.(loc);

      return loc;
    } catch {
      // GPS failed, try IP fallback
    }
  }

  const ipLoc = await ipGeolocation();
  if (ipLoc) {
    onUpdate?.(ipLoc);
    return ipLoc;
  }

  // Ultimate fallback
  return { ...GPS_DEFAULT, timestamp: Date.now() };
}

export function startWatchingPosition(
  onUpdate: (loc: GpsLocation) => void,
  onError: () => void,
): (() => void) | null {
  if (!navigator.geolocation) {
    onError();
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const accuracy = Math.max(pos.coords.accuracy, getUserAgentAccuracy());
      const loc: GpsLocation = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: Math.round(accuracy),
        timestamp: pos.timestamp,
        source: 'gps',
      };
      onUpdate(loc);

      // Reverse geocode once when accuracy is good enough
      if (accuracy < 100 && !loc.address) {
        loc.address = await reverseGeocode(loc.lat, loc.lon);
        onUpdate(loc);
      }
    },
    () => {
      onError();
    },
    { enableHighAccuracy: true, timeout: GPS_TIMEOUT, maximumAge: 10000 },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export function calculateDistance(loc1: GpsLocation, loc2: GpsLocation): number {
  return Math.round(haversine(loc1.lat, loc1.lon, loc2.lat, loc2.lon));
}

export function accuracyLabel(accuracy: number): { label: string; color: string } {
  if (accuracy === 0) return { label: 'Akurasi?', color: 'text-gray-400' };
  if (accuracy <= 5) return { label: 'Sangat Akurat', color: 'text-emerald-600' };
  if (accuracy <= 15) return { label: 'Akurat', color: 'text-emerald-500' };
  if (accuracy <= 50) return { label: 'Cukup', color: 'text-amber-500' };
  if (accuracy <= 200) return { label: 'Perkiraan', color: 'text-orange-500' };
  return { label: 'Kurang Akurat', color: 'text-red-500' };
}

export function googleMapsLink(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}

export function googleMapsDirectionsLink(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

export function googleMapsSearchLink(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat},${lon}`;
}
