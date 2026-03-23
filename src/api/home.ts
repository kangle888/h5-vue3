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
export const deletePlayerCollect = (data: any) => {
  return http.request<any>({
    url: "/playerCollect/cancelPlayerCollect",
    method: "post",
    data
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
