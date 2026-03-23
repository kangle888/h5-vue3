import { http } from "@/utils/http";

type LoginResult = {
  token?: string;
  sysUser?: Record<string, any>;
};

export function loginApi(data?: object): Promise<LoginResult> {
  return http.request({
    url: "/sysUser/login",
    method: "post",
    data
  });
}
