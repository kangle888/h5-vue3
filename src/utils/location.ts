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

export interface ITdtReverseGeoResult {
  cityLabel: string;
  provinceLabel?: string;
  districtLabel?: string;
}

export const LOCATION_CACHE_KEY = "c_location";
export const TDT_GEOCODER_TK = "690ee804e164e41e5933994fc37e3d9b";

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

export async function reverseGeocodeByTdt(
  lon: number,
  lat: number,
  tk = TDT_GEOCODER_TK
): Promise<ITdtReverseGeoResult> {
  const postStr = JSON.stringify({ lon, lat, ver: 1 });
  const url = `https://api.tianditu.gov.cn/geocoder?postStr=${encodeURIComponent(postStr)}&type=geocode&tk=${tk}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("定位解析失败");
  }

  const data = await res.json();
  if (String(data?.status) !== "0") {
    throw new Error("定位解析失败");
  }

  const ac = data?.result?.addressComponent || {};
  const cityLabel = ac.city || "";
  if (!cityLabel) {
    throw new Error("未识别到所在城市");
  }

  return {
    cityLabel,
    provinceLabel: ac.province || "",
    districtLabel: ac.county || ""
  };
}
