import { http } from "@/utils/http";

export interface ICUserInfo {
  id?: string;
  mobile?: string;
  status?: string;
  registerTime?: string;
}

export interface ICAuthLoginResult {
  accessToken: string;
  refreshToken: string;
  userInfo: ICUserInfo;
}

export interface ICAuthDTO {
  mobile?: string;
  bizType?: string;
  code?: string;
  password?: string;
  oldPassword?: string;
  newPassword?: string;
  deviceId?: string;
  refreshToken?: string;
}

export const sendCodeApi = (data: ICAuthDTO) => {
  return http.request<string>({
    url: "/c-auth/send-code",
    method: "post",
    data
  });
};

export const codeLoginApi = (data: ICAuthDTO) => {
  return http.request<ICAuthLoginResult>({
    url: "/c-auth/code-login",
    method: "post",
    data
  });
};

export const loginPasswordApi = (data: ICAuthDTO) => {
  return http.request<ICAuthLoginResult>({
    url: "/c-auth/login-password",
    method: "post",
    data
  });
};

export const refreshTokenApi = (data: ICAuthDTO) => {
  return http.request<ICAuthLoginResult>({
    url: "/c-auth/refresh-token",
    method: "post",
    data
  });
};


export const changePasswordApi = (data: ICAuthDTO) => {
  return http.request<string>({
    url: "/c-auth/change-password",
    method: "post",
    data
  });
};

export const logoutApi = (data: ICAuthDTO) => {
  return http.request<string>({
    url: "/c-auth/logout",
    method: "post",
    data
  });
};
