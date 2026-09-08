/**
 * 微信内分享卡片配置工具 (WeChat JS-SDK 分享集成)
 *
 * 适用场景：
 * 1. 微信浏览器中点击右上角 "..." -> 发送给朋友 / 分享到朋友圈
 * 2. 自动格式化标题、描述、落地页以及封面缩略图的绝对网络路径
 */

export interface WechatShareOptions {
  /** 分享卡片主标题，例如："宠粉福利，不玩套路" */
  title: string;
  /** 分享卡片副标题/描述，例如："100%中奖" */
  desc: string;
  /** 卡片右侧缩略图地址（支持相对路径如 '/share-cover.jpg' 或完整 https:// 绝对路径） */
  imgUrl?: string;
  /** 点击卡片跳转的链接（默认当前页面地址，会自适应 Hash 模式） */
  link?: string;
}

export interface WechatSignatureConfig {
  appId: string;
  timestamp: number | string;
  nonceStr: string;
  signature: string;
}

/**
 * 判断当前环境是否为微信内置浏览器
 */
export const isWechatBrowser = (): boolean => {
  if (typeof window === "undefined" || !navigator) return false;
  return /micromessenger/i.test(navigator.userAgent);
};

/**
 * 确保图片路径为外网绝对路径（微信分享要求 imgUrl 必须为带 http/https 的完整 URL）
 */
export const getAbsoluteUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const origin = window.location.origin;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${cleanPath}`;
};

/**
 * 动态加载腾讯官方微信 JS-SDK 脚本
 */
export const loadWechatSdkScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).wx) {
      resolve();
      return;
    }
    const existing = document.getElementById("wechat-jssdk-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "wechat-jssdk-script";
    script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load WeChat JS-SDK"));
    document.head.appendChild(script);
  });
};

/**
 * 默认分享配置
 */
export const DEFAULT_SHARE_CONFIG: WechatShareOptions = {
  title: "宠粉福利，不玩套路",
  desc: "100%中奖",
  imgUrl: "/share-cover.jpg"
};

/**
 * 初始化微信分享卡片
 * @param options 分享参数
 * @param signatureConfig 后端返回的微信公众号 JSSDK 签名信息（可选）
 */
export async function setWechatShare(
  options: Partial<WechatShareOptions> = {},
  signatureConfig?: WechatSignatureConfig
) {
  if (!isWechatBrowser()) {
    // 非微信环境跳过 JSSDK 注入
    return;
  }

  try {
    await loadWechatSdkScript();
    const wx = (window as any).wx;
    if (!wx) return;

    const fullConfig = {
      title: options.title || DEFAULT_SHARE_CONFIG.title,
      desc: options.desc || DEFAULT_SHARE_CONFIG.desc,
      imgUrl: getAbsoluteUrl(options.imgUrl || DEFAULT_SHARE_CONFIG.imgUrl || "/share-cover.jpg"),
      link: options.link || window.location.href
    };

    // 如果传入了公众号配置签名，则注入权限
    if (signatureConfig) {
      wx.config({
        debug: false,
        appId: signatureConfig.appId,
        timestamp: signatureConfig.timestamp,
        nonceStr: signatureConfig.nonceStr,
        signature: signatureConfig.signature,
        jsApiList: [
          "updateAppMessageShareData",
          "updateTimelineShareData",
          "onMenuShareAppMessage",
          "onMenuShareTimeline"
        ]
      });
    }

    wx.ready(() => {
      // 1. 自定义“分享给朋友”及“分享到QQ”
      if (wx.updateAppMessageShareData) {
        wx.updateAppMessageShareData({
          title: fullConfig.title,
          desc: fullConfig.desc,
          link: fullConfig.link,
          imgUrl: fullConfig.imgUrl,
          success: () => {
            console.log("[WeChat Share] updateAppMessageShareData ready");
          }
        });
      }

      // 2. 自定义“分享到朋友圈”及“分享到QQ空间”
      if (wx.updateTimelineShareData) {
        wx.updateTimelineShareData({
          title: fullConfig.title,
          link: fullConfig.link,
          imgUrl: fullConfig.imgUrl,
          success: () => {
            console.log("[WeChat Share] updateTimelineShareData ready");
          }
        });
      }

      // 兼容老版本微信客户端接口
      if (wx.onMenuShareAppMessage) {
        wx.onMenuShareAppMessage({
          title: fullConfig.title,
          desc: fullConfig.desc,
          link: fullConfig.link,
          imgUrl: fullConfig.imgUrl
        });
      }
      if (wx.onMenuShareTimeline) {
        wx.onMenuShareTimeline({
          title: fullConfig.title,
          link: fullConfig.link,
          imgUrl: fullConfig.imgUrl
        });
      }
    });

    wx.error((err: any) => {
      console.warn("[WeChat Share] wx.error:", err);
    });
  } catch (error) {
    console.error("[WeChat Share] init error:", error);
  }
}
