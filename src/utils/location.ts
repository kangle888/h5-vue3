export interface ILocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: "h5-geolocation";
  timestamp: number;
}

export interface ILocationOptions {
  timeout?: number;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
}

export const LOCATION_CACHE_KEY = "c_location";

export function getCurrentLocation(
  options: ILocationOptions = {}
): Promise<ILocationResult> {
  const {
    timeout = 10000,
    enableHighAccuracy = true,
    maximumAge = 0
  } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn("当前环境不支持定位~~~~~~~~~~~~~~~~");
      reject(new Error("当前环境不支持定位"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: "h5-geolocation",
          timestamp: Date.now()
        });
      },
      error => {
        reject(error);
      },
      {
        timeout,
        enableHighAccuracy,
        maximumAge
      }
    );
  });
}

export function saveLocationCache(location: ILocationResult) {
  localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
}

export function getLocationCache(): ILocationResult | null {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ILocationResult;
  } catch {
    return null;
  }
}
