import { http } from "@/utils/http";

export interface ISysBannerItem {
  id?: string;
  title?: string;
  image?: string;
  imageUrl?: string;
  link?: string;
  sort?: number;
  status?: string;
  banner1?: string;
  banner2?: string;
  banner3?: string;
  banner4?: string;
  banner5?: string;
}

export const getSysBannerInfoApi = () => {
  return http.request<ISysBannerItem[] | ISysBannerItem>({
    url: "/sysBanner/info",
    method: "get"
  });
};
