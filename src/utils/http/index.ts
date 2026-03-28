import Axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosResponse,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig
} from "axios";
import { ContentTypeEnum } from "@/enums/request-enum";
// import NProgress from "../progress";
import { showFailToast } from "vant";
import "vant/es/toast/style";

interface IRefreshResponse {
  code?: number;
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

interface IRetryRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// 默认 axios 实例请求配置
const configDefault: AxiosRequestConfig = {
  headers: {
    "Content-Type": ContentTypeEnum.JSON
  },
  timeout: 10000,
  baseURL: import.meta.env.VITE_BASE_API,
  data: {}
};

class Http {
  // 当前实例
  private static axiosInstance: AxiosInstance;
  // 请求配置
  private static axiosConfigDefault: AxiosRequestConfig;
  // 刷新状态
  private static isRefreshing = false;
  // 等待队列
  private static refreshSubscribers: Array<(token: string | null) => void> = [];

  private notifyRefreshSubscribers(token: string | null): void {
    Http.refreshSubscribers.forEach(cb => cb(token));
    Http.refreshSubscribers = [];
  }

  private getAccessToken(): string {
    return localStorage.getItem("c_access_token") || localStorage.getItem("token") || "";
  }

  private clearAuthAndRedirect(): void {
    localStorage.removeItem("c_access_token");
    localStorage.removeItem("c_refresh_token");
    localStorage.removeItem("token");
    localStorage.removeItem("c_user_info");

    if (location.hash !== "#/login") {
      location.hash = "#/login";
    }
  }

  private async tryRefreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem("c_refresh_token") || "";
    const deviceId = localStorage.getItem("c_device_id") || "default_device";

    if (!refreshToken) {
      throw new Error("refresh token is empty");
    }

    const refreshRes = await Axios.request<IRefreshResponse>({
      baseURL: Http.axiosConfigDefault.baseURL,
      url: "/c-auth/refresh-token",
      method: "post",
      headers: {
        "Content-Type": ContentTypeEnum.JSON,
        "access-token": this.getAccessToken()
      },
      data: {
        refreshToken,
        deviceId
      }
    });

    const { code, data } = refreshRes?.data || {};
    if (code !== 200 || !data?.accessToken) {
      throw new Error("refresh token failed");
    }

    localStorage.setItem("c_access_token", data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("c_refresh_token", data.refreshToken);
    }

    return data.accessToken;
  }

  private async handleUnauthorized(originalConfig: IRetryRequestConfig): Promise<any> {
    const requestUrl = originalConfig.url || "";

    // 刷新接口本身 401，直接退出
    if (requestUrl.includes("/c-auth/refresh-token")) {
      this.clearAuthAndRedirect();
      showFailToast("登录已失效，请重新登录");
      return Promise.reject(new Error("refresh token invalid"));
    }

    if (originalConfig._retry) {
      this.clearAuthAndRedirect();
      showFailToast("登录已失效，请重新登录");
      return Promise.reject(new Error("request retry failed"));
    }

    if (Http.isRefreshing) {
      return new Promise((resolve, reject) => {
        Http.refreshSubscribers.push((newToken: string | null) => {
          if (!newToken) {
            reject(new Error("refresh token failed"));
            return;
          }
          const nextConfig: IRetryRequestConfig = {
            ...originalConfig,
            headers: {
              ...(originalConfig.headers || {}),
              "access-token": newToken
            },
            _retry: true
          };
          resolve(Http.axiosInstance.request(nextConfig));
        });
      });
    }

    originalConfig._retry = true;
    Http.isRefreshing = true;

    try {
      const newToken = await this.tryRefreshToken();
      this.notifyRefreshSubscribers(newToken);

      const nextConfig: IRetryRequestConfig = {
        ...originalConfig,
        headers: {
          ...(originalConfig.headers || {}),
          "access-token": newToken
        }
      };

      return Http.axiosInstance.request(nextConfig);
    } catch (error) {
      this.notifyRefreshSubscribers(null);
      this.clearAuthAndRedirect();
      showFailToast("登录已失效，请重新登录");
      return Promise.reject(error);
    } finally {
      Http.isRefreshing = false;
    }
  }

  // 请求拦截
  private httpInterceptorsRequest(): void {
    Http.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // NProgress.start();
        // 发送请求前，可在此携带 token
        const token = this.getAccessToken();
        if (token) {
          config.headers["access-token"] = token;
        }
        return config;
      },
      (error: AxiosError) => {
        showFailToast(error.message);
        return Promise.reject(error);
      }
    );
  }

  // 响应拦截
  private httpInterceptorsResponse(): void {
    Http.axiosInstance.interceptors.response.use(
      async (response: AxiosResponse) => {
        // NProgress.done();
        // 与后端协定的返回字段（当前后端为 code + message + data）
        const { code, message, data } = response.data ?? {};
        const hasCode = Reflect.has(response.data ?? {}, "code");
        const isSuccess = hasCode && code === 200;

        if (isSuccess) {
          return data;
        }

        if (code === 401 || message === "unauthorized") {
          return this.handleUnauthorized((response.config || {}) as IRetryRequestConfig);
        }

        if (message) {
          showFailToast(message);
        }
        return Promise.reject(response.data);
      },
      async (error: AxiosError) => {
        // NProgress.done();
        const status = error.response?.status;

        if (status === 401) {
          return this.handleUnauthorized((error.config || {}) as IRetryRequestConfig);
        }

        // 处理 HTTP 网络错误
        let message = "";
        switch (status) {
          case 400:
            message = "请求错误";
            break;
          case 403:
            message = "拒绝访问";
            break;
          case 404:
            message = `请求地址出错: ${error.response?.config?.url}`;
            break;
          case 408:
            message = "请求超时";
            break;
          case 500:
            message = "服务器内部错误";
            break;
          case 501:
            message = "服务未实现";
            break;
          case 502:
            message = "网关错误";
            break;
          case 503:
            message = "服务不可用";
            break;
          case 504:
            message = "网关超时";
            break;
          case 505:
            message = "HTTP版本不受支持";
            break;
          default:
            message = "网络连接故障";
        }

        showFailToast(message);
        return Promise.reject(error);
      }
    );
  }

  constructor(config: AxiosRequestConfig) {
    Http.axiosConfigDefault = config;
    Http.axiosInstance = Axios.create(config);
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  // 通用请求函数
  public request<T>(paramConfig: AxiosRequestConfig): Promise<T> {
    const config = { ...Http.axiosConfigDefault, ...paramConfig };
    return new Promise((resolve, reject) => {
      Http.axiosInstance
        .request(config)
        .then((response: any) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

export const http = new Http(configDefault);
