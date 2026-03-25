<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { showFailToast, Swipe, SwipeItem } from "vant";
import { useRouter } from "vue-router";
import { getAttachmentObjectUrl } from "@/api/home";
import { getSysBannerInfoApi, type ISysBannerItem } from "@/api/sys-banner";

defineOptions({ name: "LandingPage" });

const router = useRouter();
const loading = ref(false);
const banners = ref<(ISysBannerItem & { imageSrc: string })[]>([]);

const inviteCode = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem("c_user_info") || "{}");
    return user?.inviteCode || "FH1BQW";
  } catch {
    return "FH1BQW";
  }
});

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

const copyInviteCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value);
  } catch {
    showFailToast("复制失败，请手动复制");
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
      <Swipe
        v-if="banners.length"
        class="landing-swiper"
        vertical
        :loop="true"
        :autoplay="3500"
        :show-indicators="true"
        indicator-color="#d7b98f"
      >
        <SwipeItem v-for="item in banners" :key="item.id || item.imageSrc">
          <div class="slide-page">
            <img class="hero-bg" :src="item.imageSrc" alt="banner" />
            <div class="overlay"></div>

            <div class="center-content">
              <h1 class="brand">闪月</h1>
              <p class="slogan">达人认证 · 超高颜值</p>

              <div class="invite-box">
                <span class="invite-label">邀请码</span>
                <span class="invite-code">{{ inviteCode }}</span>
                <button class="copy-btn" @click="copyInviteCode">复制</button>
              </div>

              <button class="cta-btn ios-btn">苹果用户下载</button>
              <button class="cta-btn web-btn" @click="goWebApp">进入网页版</button>
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

.cta-btn {
  margin-top: 14px;
  width: 270px;
  height: 48px;
  border-radius: 24px;
  border: none;
  font-size: 20px;
  font-weight: 600;
}

.ios-btn {
  margin-top: 20px;
  background: #f3ddb4;
  color: #2f2011;
}

.web-btn {
  background: #73cfee;
  color: #0d2f40;
}
</style>
