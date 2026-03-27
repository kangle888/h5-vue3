import axios from "axios";
import { http } from "@/utils/http";

export interface IPlayerItem {
  id?: string;
  name?: string;
  avatar?: string;
  album?: string;
  city?: string;
  longitude?: string;
  latitude?: string;
  price?: number;
  sex?: string;
  sex_dictText?: string;
  age?: string;
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

// /player/listPlayer
export const listPlayer = (data: IPageParam<Partial<IPlayerItem>>) => {
  return http.request<IPageResult<IPlayerItem>>({
    url: "/player/listPlayer",
    method: "post",
    data
  });
};

// /player/queryById
export const queryById = (playerId: string) => {
  return http.request<IPlayerItem>({
    url: "/player/queryById",
    method: "get",
    params: { playerId }
  });
};

// 收藏人物  /playerCollect/addPlayerCollect
export const addPlayerCollect = (data: any) => {
  return http.request<any>({
    url: "/playerCollect/addPlayerCollect",
    method: "post",
    data
  });
};

// 取消收藏人物
export const deletePlayerCollect = (id: string) => {
  return http.request<any>({
    url: "/playerCollect/cancelPlayerCollect",
    method: "get",
    params: { id }
  });
};

// /playerCollect/queryById
export const queryByIdPlayerCollect = (id: string) => {
  return http.request<any>({
    url: "/playerCollect/queryById",
    method: "get",
    params: { id }
  });
};

// 附件下载（返回 Blob，用于 image src=URL.createObjectURL(blob)）
export const downloadAttachment = async (fileName: string) => {
  const token = localStorage.getItem("token") || "";
  return axios.request<Blob>({
    url: `${import.meta.env.VITE_BASE_API}/attachment/download`,
    method: "get",
    params: { fileName },
    headers: {
      "access-token": token
    },
    responseType: "blob"
  });
};

const attachmentUrlCache = new Map<string, string>();

// 下载附件并返回可直接给 <img src> 使用的对象 URL（含简单缓存）
export const getAttachmentObjectUrl = async (fileName?: string) => {
  if (!fileName) return "";
  if (attachmentUrlCache.has(fileName)) {
    return attachmentUrlCache.get(fileName) as string;
  }
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

export const pagePlayerCollect = (data: IPageParam<Partial<IPlayerCollectItem>>) => {
  return http.request<IPageResult<IPlayerCollectItem>>({
    url: "/playerCollect/pagePlayerCollect",
    method: "post",
    data
  });
};

export interface IPlayerActivityItem {
  id?: string;
  content?: string;
  createTime?: string;
  city?: string;
  playerId?: string;
  image1?: string;
  image2?: string;
  image3?: string;
}

// /playerActivity/page   入参playerId  get
export const getPlayerActivity = (data: { pageNum: number; pageSize: number; playerId?: string; query?: { playerId?: string } }) => {
  const payload = {
    ...data,
    query: data.query ?? { playerId: data.playerId }
  };
  return http.request<IPageResult<IPlayerActivityItem>>({
    url: "/playerActivity/page",
    method: "post",
    data: payload
  });
};
