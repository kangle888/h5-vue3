import axios from "axios";
import { http } from "@/utils/http";

export type PromotionEventType = "visit" | "download_click" | "install_open" | "register";

export interface IPromotionTrackPayload {
  pageId?: string;
  channelId?: string;
  staffId?: string;
  traceId?: string;
  eventType: PromotionEventType;
  sourcePath?: string;
  userAgent?: string;
  platform?: string;
  extra?: Record<string, any>;
}

export interface IPromotionPageInfo {
  id?: string;
  pageId?: string;
  title?: string;
  downloadUrl?: string;
  iosQr?: string;
  androidQr?: string;
  qrLink?: string;
  status?: string;
  [key: string]: any;
}


export const getPromotionPageInfo = (params: {
  pageId?: string;
  channelId?: string;
  staffId?: string;
}) => {
  return http.request<IPromotionPageInfo>({
    url: "/promotion/pageInfo",
    method: "get",
    params
  });
};

export const trackPromotionEvent = (data: IPromotionTrackPayload) => {
  return http.request<any>({
    url: "/promotion/track",
    method: "post",
    data
  });
};


export const getPromotionDownloadUrl = (params: {
  pageId?: string;
  channelId?: string;
  staffId?: string;
  traceId?: string;
  platform?: string;
}) => {
  return `${import.meta.env.VITE_BASE_API}/promotion/download?${new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null && String(value).trim()) acc[key] = String(value);
      return acc;
    }, {})
  ).toString()}`;
};

/** 初始化推广追踪：服务端生成 traceId，记录 visit 事件 */
export const initTraceApi = (data: {
  pageId?: string;
  channelId?: string;
  staffId?: string;
}) => {
  return http.request<{ traceId: string }>({
    url: "/promotion/initTrace",
    method: "post",
    data
  });
};

/** 登录归因回传：登录/注册成功后将 userId 与 traceId 绑定 */
export const reportLoginApi = (data: {
  traceId?: string;
  userId?: string;
  pageId?: string;
  channelId?: string;
  staffId?: string;
  eventType?: string;
}) => {
  return http.request<any>({
    url: "/promotion/reportLogin",
    method: "post",
    data
  });
};

/**
 * 检测当前设备平台
 * 一门 App iOS/Android 共用同一下载链接，落地页需自动识别
 */
export const detectPlatform = (): "ios" | "android" | "h5" => {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "h5";
};

/** 写入剪贴板（失败时静默，不影响主流程） */
export const writeClipboard = async (text: string): Promise<void> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // 部分浏览器不支持，静默处理
  }
};

/** 读取剪贴板（失败时返回空字符串） */
export const readClipboard = async (): Promise<string> => {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      return await navigator.clipboard.readText();
    }
  } catch {
    // 部分浏览器不支持，静默处理
  }
  return "";
};

export interface IPlayerItem {
  id?: string;
  name?: string;
  avatar?: string;
  album?: string;
  city?: string;
  province?: string;
  cityName?: string;
  area?: string;
  longitude?: string;
  latitude?: string;
  price?: number;
  sex?: string;
  sex_dictText?: string;
  age?: string;
  recentMonths?: number;
  introduction?: string;
  skill?: string;
  createTime?: string;
  updateTime?: string;
  isDelete?: string;
  isDisable?: string;
  hot?: number;
  constellation?: string;
  birthday?: string;
  signature?: string;
  signature_dictText?: string;
  occupation?: string;
  occupation_dictText?: string;
  height?: string;
  weight?: string;
  onlineStatus?: string;
  createBy?: string;
}

export interface IPageParam<T> {
  pageNum: number;
  pageSize: number;
  query: T;
}

export interface IPageResult<T> {
  records: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export const listPlayer = (data: IPageParam<Partial<IPlayerItem>>) => http.request<IPageResult<IPlayerItem>>({ url: "/player/listPlayer", method: "post", data });
export const listPlayerClient = (data: IPageParam<Partial<IPlayerItem>>) => http.request<IPageResult<IPlayerItem>>({ url: "/player/listPlayerClient", method: "post", data });
export const queryById = (playerId: string) => http.request<IPlayerItem>({ url: "/player/queryById", method: "get", params: { playerId } });
export const addPlayerCollect = (data: any) => http.request<any>({ url: "/playerCollect/addPlayerCollect", method: "post", data });
export const deletePlayerCollect = (id: string) => http.request<any>({ url: "/playerCollect/cancelPlayerCollect", method: "get", params: { id } });
export const queryByIdPlayerCollect = (collectPlayerId: string) => http.request<any>({ url: "/playerCollect/queryByCollectPlayerId", method: "get", params: { collectPlayerId } });

export const downloadAttachment = async (fileName: string) => {
  const token = localStorage.getItem("token") || "";
  return axios.request<Blob>({
    url: `${import.meta.env.VITE_BASE_API}/attachment/download`,
    method: "get",
    params: { fileName },
    headers: { "access-token": token },
    responseType: "blob"
  });
};

const attachmentUrlCache = new Map<string, string>();
export const getAttachmentObjectUrl = async (fileName?: string) => {
  if (!fileName) return "";
  if (attachmentUrlCache.has(fileName)) return attachmentUrlCache.get(fileName) as string;
  const res = await downloadAttachment(fileName);
  const blob = res?.data as Blob;
  if (!blob) return "";
  const url = URL.createObjectURL(blob);
  attachmentUrlCache.set(fileName, url);
  return url;
};

export interface IPlayerCollectItem {
  id?: string;
  playerId?: string;
  collectPlayerId?: string;
  isCancel?: string;
}
export const pagePlayerCollect = (data: IPageParam<Partial<IPlayerCollectItem>>) => http.request<IPageResult<IPlayerCollectItem>>({ url: "/playerCollect/pagePlayerCollect", method: "post", data });

export interface IPlayerActivityItem {
  id?: string;
  content?: string;
  createTime?: string;
  city?: string;
  playerId?: string;
  playerName?: string;
  playerAvatar?: string;
  image1?: string;
  image2?: string;
  image3?: string;
}
export const getPlayerActivity = (data: { pageNum: number; pageSize: number; playerId?: string; query?: { playerId?: string } }) => {
  const payload = { ...data, query: data.query ?? { playerId: data.playerId } };
  return http.request<IPageResult<IPlayerActivityItem>>({ url: "/playerActivity/page", method: "post", data: payload });
};
export const pagePlayerCollectList = (data: any) => http.request<any>({ url: "/playerCollect/pagePlayerCollectList", method: "post", data });
