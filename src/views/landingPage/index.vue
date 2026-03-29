<script setup lang="ts">
import { onMounted, ref } from "vue";
import { showFailToast, Swipe, SwipeItem } from "vant";
import iosQr from "@/assets/ios.png";
import androidQr from "@/assets/安卓.png";
import { useRouter } from "vue-router";
import { getAttachmentObjectUrl } from "@/api/home";
import { getSysBannerInfoApi, type ISysBannerItem } from "@/api/sys-banner";

defineOptions({ name: "LandingPage" });

const router = useRouter();
const loading = ref(false);
const banners = ref<(ISysBannerItem & { imageSrc: string })[]>([]);

const normalizeList = (res: ISysBannerItem[] | ISysBannerItem) => {
  if (Array.isArray(res)) return res;
  if (!res) return [];
  return [res];
};

const getBannerFiles = (item: ISysBannerItem) => {
  const list = [item.banner1, item.banner2, item.banner3, item.banner4, item.banner5];
  return list.map(v => (v || "").trim()).filter(Boolean);
};

const loadBanners = async () => {
  loading.value = true;
  try {
    const res = await getSysBannerInfoApi();
    const list = normalizeList(res).filter(item => item.status !== "0");

    const rows: (ISysBannerItem & { imageSrc: string })[] = [];

    for (const item of list) {
      const files = getBannerFiles(item);

      if (!files.length) {
        const fallback = item.imageUrl || item.image || "";
        if (fallback) {
          let imageSrc = "";
          if (fallback.startsWith("http://") || fallback.startsWith("https://") || fallback.startsWith("blob:")) {
            imageSrc = fallback;
          } else {
            imageSrc = await getAttachmentObjectUrl(fallback);
          }
          if (imageSrc) rows.push({ ...item, imageSrc });
        }
        continue;
      }

      for (const fileName of files) {
        const imageSrc = await getAttachmentObjectUrl(fileName);
        if (imageSrc) {
          rows.push({ ...item, imageSrc });
        }
      }
    }

    banners.value = rows;
  } catch {
    showFailToast("落地页加载失败");
  } finally {
    loading.value = false;
  }
};

const goWebApp = () => {
  router.push({ name: "Login" });
};

onMounted(() => {
  loadBanners();
});
</script>

<template>
  <div class="landing-page">
    <div v-if="loading" class="loading-wrap">
      <van-loading color="#d7b98f" />
    </div>

    <template v-else>
      <Swipe v-if="banners.length" class="landing-swiper" vertical :loop="true" :autoplay="3500" :show-indicators="true"
        indicator-color="#d7b98f">
        <SwipeItem v-for="item in banners" :key="item.id || item.imageSrc">
          <div class="slide-page">
            <img class="hero-bg" :src="item.imageSrc" alt="banner" />
            <div class="overlay"></div>

            <div class="center-content">
              <h1 class="brand">遇见</h1>
              <p class="slogan">达人认证 · 超高颜值</p>

              <!-- <div class="invite-box">
                <span class="invite-label">邀请码</span>
                <span class="invite-code">{{ inviteCode }}</span>
                <button class="copy-btn" @click="copyInviteCode">复制</button>
              </div> -->

              <div class="download-section">
                <div class="download-title">扫码下载 App</div>
                <div class="qr-grid">
                  <div class="qr-card">
                    <img :src="iosQr" class="qr-img" alt="ios-qr" />
                    <p class="qr-label">iOS 下载</p>
                  </div>
                  <div class="qr-card">
                    <img :src="androidQr" class="qr-img" alt="android-qr" />
                    <p class="qr-label">Android 下载</p>
                  </div>
                </div>
                <p class="qr-tip">请使用系统相机扫码下载</p>
              </div>

              <!-- <button class="cta-btn web-btn" @click="goWebApp">进入网页版</button> -->
            </div>
          </div>
        </SwipeItem>
      </Swipe>

      <div v-else class="empty-wrap">
        <p>暂无落地页内容</p>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
.landing-page {
  height: 100vh;
  background: #030412;
  color: #fff;
}

.loading-wrap,
.empty-wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}

.landing-swiper {
  height: 100%;

  :deep(.van-swipe__indicators--right) {
    right: 10px;
  }

  :deep(.van-swipe__indicator) {
    width: 8px;
    height: 8px;
    margin: 5px 0;
    background: rgba(255, 255, 255, 0.3);
  }

  :deep(.van-swipe__indicator--active) {
    background: #d7b98f;
    height: 18px;
    border-radius: 10px;
  }
}

.slide-page {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(4, 6, 20, 0.4) 0%, rgba(4, 6, 20, 0.75) 100%);
}

.center-content {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 120px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand {
  font-size: 42px;
  font-weight: 700;
  color: #e6caa0;
  margin: 0;
}

.slogan {
  margin-top: 8px;
  font-size: 24px;
  font-weight: 700;
  color: #e6caa0;
}

.invite-box {
  margin-top: 26px;
  height: 42px;
  border-radius: 21px;
  background: rgba(245, 223, 189, 0.9);
  color: #2c1d0e;
  display: flex;
  align-items: center;
  padding: 0 10px 0 14px;
  gap: 8px;
}

.invite-label {
  font-size: 14px;
  color: #6d5133;
}

.invite-code {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #3b2a17;
}

.copy-btn {
  border: none;
  height: 30px;
  padding: 0 14px;
  border-radius: 15px;
  background: #f3e4cc;
  color: #4f3620;
  font-size: 14px;
}

.download-section {
  width: 100%;
  margin-top: 18px;
  padding: 14px 14px 12px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(12, 17, 36, 0.66) 0%, rgba(12, 17, 36, 0.42) 100%);
  border: 1px solid rgba(215, 185, 143, 0.3);
  backdrop-filter: blur(4px);
}

.download-title {
  font-size: 15px;
  font-weight: 700;
  color: #f1d8b3;
  text-align: center;
}

.qr-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.qr-card {
  padding: 10px 8px 8px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-img {
  width: 112px;
  height: 112px;
  border-radius: 10px;
  background: #fff;
  padding: 6px;
  object-fit: contain;
}

.qr-label {
  margin: 8px 0 0;
  font-size: 13px;
  color: #f7e5ca;
}

.qr-tip {
  margin: 10px 0 0;
  font-size: 12px;
  text-align: center;
  color: rgba(255, 255, 255, 0.72);
}

.cta-btn {
  margin-top: 14px;
  width: 270px;
  height: 46px;
  border-radius: 23px;
  border: none;
  font-size: 18px;
  font-weight: 600;
}

.web-btn {
  background: #73cfee;
  color: #0d2f40;
}
</style>
