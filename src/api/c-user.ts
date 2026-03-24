import { http } from "@/utils/http";

export interface ICUserProfile {
  id?: string;
  mobile?: string;
  avatar?: string;
  nickname?: string;
  age?: string;
  occupation?: string;
  height?: string;
  weight?: string;
  introduction?: string;
  constellation?: string;
}

export const getCurrentCUserApi = () => {
  return http.request<ICUserProfile>({
    url: "/c-user/getCurrent",
    method: "get"
  });
};

export const updateCurrentCUserApi = (data: ICUserProfile) => {
  return http.request<string>({
    url: "/c-user/updateCurrent",
    method: "post",
    data
  });
};

export const uploadAttachmentApi = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<string>({
    url: "/attachment/upload",
    method: "post",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};

export const getAttachmentDownloadUrl = (fileName?: string) => {
  if (!fileName) return "";
  const base = import.meta.env.VITE_BASE_API;
  const token = encodeURIComponent(localStorage.getItem("c_access_token") || localStorage.getItem("token") || "");
  return `${base}/attachment/download?fileName=${encodeURIComponent(fileName)}&access-token=${token}`;
};
