import { http } from "@/utils/http";

export interface ActivityInitResult {
  device_id: string;
  invite_code: string;
  inviter_code?: string | null;
  points: number;
  draw_chances: number;
  invite_count: number;
  can_claim_invite_reward: boolean;
  reward_taken: boolean;
}

export interface ActivityInfoResult {
  device_id: string;
  invite_code: string;
  points: number;
  draw_chances: number;
  invite_count: number;
}

export interface DrawResult {
  prize: string;
  points: number;
  draw_chances: number;
}

export interface ActivityInitPayload {
  device_id: string;
  invite_code?: string;
}

export interface ActivityDrawPayload {
  device_id: string;
}

export interface ActivityInviteClaimPayload {
  device_id: string;
  inviter_code: string;
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

export const activityInviteClaimApi = (data: ActivityInviteClaimPayload) => {
  return http.request<{ device_id: string; invite_code: string; points: number; draw_chances: number; inviter_points: number }>({
    url: "/activity/claim-invite",
    method: "post",
    data
  });
};
