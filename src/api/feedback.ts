import { http } from "@/utils/http";

export interface IFeedbackForm {
  content: string;
  contact?: string;
}

export const addFeedbackApi = (data: IFeedbackForm) => {
  return http.request<string>({
    url: "/c-feedback/add",
    method: "post",
    data
  });
};
