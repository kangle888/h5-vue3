<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import drawIcon from "@/assets/img1.png";

const router = useRouter();
const inviteCode = ref("");

const banners = [
  {
    title: "活动抽奖",
    desc: "首次进入送 1 次抽奖机会，邀请好友还能继续赚积分。",
    badge: "限时活动",
    visual: "好运来袭",
    bg: "linear-gradient(135deg, #ffb36a, #ff7a45)",
    image: "https://xxx.xxx.com/activity/banner-1.jpg"
  },
  {
    title: "抽奖赢奖品",
    desc: "奖品概率固定，中奖结果由后端直接返回。",
    badge: "中奖概率",
    visual: "马上抽奖",
    bg: "linear-gradient(135deg, #ffd89b, #f6a13b)",
    image: "https://xxx.xxx.com/activity/banner-2.jpg"
  },
  {
    title: "分享拿积分",
    desc: "每邀请 1 位新用户，邀请人 +1 积分，10 积分可兑换 1 次抽奖。",
    badge: "邀请奖励",
    visual: "分享好友",
    bg: "linear-gradient(135deg, #ff9966, #ff5e62)",
    image: "https://xxx.xxx.com/activity/banner-3.jpg"
  }
];

const currentBanner = ref(0);

const goDraw = () => {
  router.push("/activity/draw");
};

onMounted(() => {
  const stored = localStorage.getItem("activity_invite_code") || "";
  inviteCode.value = stored;
});
</script>

<template>
  <div class="home-page">
    <van-swipe class="home-swipe" :autoplay="3000" @change="index => (currentBanner = index)" indicator-color="#fff">
      <van-swipe-item v-for="banner in banners" :key="banner.title">
        <div class="home-banner" :style="{ background: banner.bg }">
          <img class="home-banner-img" :src="banner.image" :alt="banner.title" />
          <div class="home-copy">
            <div class="badge">{{ banner.badge }}</div>
            <h1>{{ banner.title }}</h1>
            <p>{{ banner.desc }}</p>
          </div>
          <div class="home-visual">{{ banner.visual }}</div>
        </div>
      </van-swipe-item>
    </van-swipe>

    <button class="go-draw-fab" @click="goDraw" aria-label="去抽奖">
      <img :src="drawIcon" alt="" />
    </button>
  </div>
</template>

<style scoped lang="less">
.home-page {
  min-height: 100vh;
  padding: 0;
  background: linear-gradient(180deg, #fff7ef 0%, #fff 40%, #f5f7fb 100%);
}

.home-swipe {
  height: 100vh;
}

.home-banner {
  height: 100%;
  padding: 20px 16px 88px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  overflow: hidden;
}

.home-banner-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.home-banner::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.28));
  z-index: 1;
}

.home-copy,
.home-visual {
  position: relative;
  z-index: 2;
}

.home-copy h1 {
  margin: 10px 0 8px;
  font-size: 24px;
  line-height: 1.25;
}

.home-copy p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.95;
}

.badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  font-size: 12px;
  font-weight: 700;
}

.home-indicator {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 12px 0 8px;
}

.home-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 122, 69, 0.22);
}

.home-indicator span.active {
  width: 20px;
  border-radius: 999px;
  background: #ff7a45;
}

.go-draw-fab {
  position: fixed;
  right: 14px;
  bottom: 18px;
  width: 52px;
  height: 52px;
  border: 0;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 900;
  background: linear-gradient(90deg, #ff9b47, #ff6b2c);
  box-shadow: 0 14px 28px rgba(255, 122, 69, 0.3);
  z-index: 20;
  animation: floatPulse 1.8s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

.go-draw-fab img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
}

@keyframes floatPulse {
  0%, 100% {
    transform: translateY(0);
    box-shadow: 0 14px 28px rgba(255, 122, 69, 0.3);
  }
  50% {
    transform: translateY(-2px);
    box-shadow: 0 18px 34px rgba(255, 122, 69, 0.38);
  }
}
</style>
