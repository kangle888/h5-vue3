import { http } from "@/utils/http";

export interface ActivityInitResult {
  device_id: string;
  draw_chances: number;
  points: number;
  invite_code?: string;
}

export interface ActivityInfoResult {
  device_id: string;
  draw_chances: number;
  points: number;
}

export interface DrawPrizePayloadItem {
  id: number;
  name: string;
  image?: string;
  weight: number;
}

export interface ActivityDrawPayload {
  device_id: string;
  prizes?: DrawPrizePayloadItem[];
  init_chances?: number;
}

export interface DrawResult {
  prize_id: number;
  prize_name: string;
  prize_image?: string;
  draw_chances: number;
  record_id?: number;
}

export interface ActivityInitPayload {
  device_id: string;
  init_chances?: number;
}

export interface DrawRecordItem {
  id: number;
  device_id: string;
  prize_id: number;
  prize_name: string;
  prize_image?: string;
  created_at: string;
}

export const activityInitApi = (data: ActivityInitPayload) => {
  return http.request<ActivityInitResult>({
    url: "/activity/init",
    method: "post",
    data
  });
};

export const activityInfoApi = (deviceId: string) => {
  return http.request<ActivityInfoResult>({
    url: "/activity/info",
    method: "get",
    params: { device_id: deviceId }
  });
};

export const activityDrawApi = (data: ActivityDrawPayload) => {
  return http.request<DrawResult>({
    url: "/activity/draw",
    method: "post",
    data
  });
};

export const activityRecordsApi = (deviceId: string) => {
  return http.request<DrawRecordItem[]>({
    url: "/activity/records",
    method: "get",
    params: { device_id: deviceId }
  });
};

export const activityRecordDetailApi = (recordId: number) => {
  return http.request<DrawRecordItem>({
    url: `/activity/record/${recordId}`,
    method: "get"
  });
};

export const activitySetChancesApi = (deviceId: string, chances: number) => {
  return http.request<{ device_id: string; draw_chances: number }>({
    url: "/activity/set-chances",
    method: "post",
    params: { device_id: deviceId, chances }
  });
};
