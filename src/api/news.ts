import { http } from "@/utils/http";

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

export interface IChatRoomItem {
  sendUserId?: string;
  receiveUserId?: string;
  sendUserName?: string;
  receiveUserName?: string;
  targetUserId?: string;
  targetUserName?: string;
  lastContent?: string;
  lastTime?: string;
}

export interface IPlayMessageItem {
  id?: string;
  content?: string;
  senderId?: string;
  receiverId?: string;
  createTime?: string;
  messageType?: "text" | "file";
  messageStatus?: string;
  isCancel?: string;
  readStatus?: string;
}

// /playMessage/pageMessage 分页查询消息列表
export function pageMessageApi(data: IPageParam<Partial<IPlayMessageItem>>): Promise<IPageResult<IPlayMessageItem>> {
  return http.request({
    url: "/playMessage/pageMessage",
    method: "post",
    data
  });
}

// /playMessage/pageChatRoom 分页查询聊天室列表
export function pageChatRoomApi(data: IPageParam<Partial<IChatRoomItem>>): Promise<IPageResult<IChatRoomItem>> {
  return http.request({
    url: "/playMessage/pageChatRoom",
    method: "post",
    data
  });
}

// 获取管理员用户id
export function getAdminUserApi(): Promise<string> {
  return http.request({
    url: "/playMessage/adminUser",
    method: "get"
  });
}

// 统计未读数（senderId 可选，不传统计总未读）
export function countUnreadApi(senderId?: string): Promise<number> {
  return http.request({
    url: "/playMessage/countUnread",
    method: "get",
    params: senderId ? { senderId } : {}
  });
}

// 标记某会话为已读
export function markReadApi(senderId: string): Promise<number> {
  return http.request({
    url: "/playMessage/markRead",
    method: "post",
    params: { senderId }
  });
}

// /websocket/sendText 发送文本消息
export function sendTextApi(data: Partial<IPlayMessageItem>): Promise<any> {
  return http.request({
    url: "/websocket/sendText",
    method: "post",
    data
  });
}

// /websocket/sendFile 发送文件消息
export function sendFileApi(data: FormData): Promise<any> {
  return http.request({
    url: "/websocket/sendFile",
    method: "post",
    data,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}

// /websocket/cancel 撤销消息 get  messageId
export function cancelMessageApi(data?: object): Promise<any> {
  return http.request({
    url: "/websocket/cancel",
    method: "get",
    params: data
  });
}
