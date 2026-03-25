import { http } from "@/utils/http";

export interface ISysBannerItem {
  id?: string;
  title?: string;
  image?: string;
  imageUrl?: string;
  link?: string;
  sort?: number;
}

export const getSysBannerInfoApi = () => {
  return http.request<ISysBannerItem[] | ISysBannerItem>({
    url: "/sysBanner/info",
    method: "get"
  });
};
