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
  targetUserAvatar?: string;
  avatar?: string;
  targetUserMobile?: string;
  lastContent?: string;
  lastTime?: string;
  unreadCount?: number;
  sessionKey?: string;
  scene?: "player" | "service";
  playerId?: string;
  playerName?: string;
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
  scene?: string;
  playerId?: string;
  playerName?: string;
  sessionKey?: string;
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

// 统计未读数（senderId/sessionKey 可选，不传统计总未读）
export function countUnreadApi(senderId?: string, sessionKey?: string): Promise<number> {
  const params: Record<string, string> = {};
  if (senderId) params.senderId = senderId;
  if (sessionKey) params.sessionKey = sessionKey;
  return http.request({
    url: "/playMessage/countUnread",
    method: "get",
    params
  });
}

// 标记某会话为已读（sessionKey 可选）
export function markReadApi(senderId: string, sessionKey?: string): Promise<number> {
  const params: Record<string, string> = { senderId };
  if (sessionKey) params.sessionKey = sessionKey;
  return http.request({
    url: "/playMessage/markRead",
    method: "post",
    params
  });
}

// 删除会话（C端）
export function deleteChatRoomApi(targetUserId: string, sessionKey?: string): Promise<number> {
  const params: Record<string, string> = { targetUserId };
  if (sessionKey) params.sessionKey = sessionKey;
  return http.request({
    url: "/playMessage/deleteChatRoom",
    method: "post",
    params
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
