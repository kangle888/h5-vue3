<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import drawIcon from "@/assets/img1.png";
import { k } from "node_modules/vite/dist/node/types.d-aGj9QkWt";

const router = useRouter();
const inviteCode = ref("");

const banners = [
  {
    key: 1,
    image: "https://xklandlxy.art/images/activity3.jpg"
  },
  {
    key: 2,
    image: "https://xklandlxy.art/images/activity2.jpg"
  },
  {
    key: 3,
    image: "https://xklandlxy.art/images/activity2.jpg"
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
    <van-swipe
      class="home-swipe"
      :autoplay="3000"
      @change="index => (currentBanner = index)"
      indicator-color="#fff"
    >
      <van-swipe-item v-for="banner in banners" :key="banner.key">
        <div class="home-banner">
          <img class="home-banner-img" :src="banner.image" />
        </div>
      </van-swipe-item>
    </van-swipe>

    <div class="go-draw-fab" @click="goDraw">
      <img :src="drawIcon" alt="" />
      <div class="text">去抽奖</div>
    </div>
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
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.28));
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
  background: rgba(255, 255, 255, 0.18);
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
  font-size: 12px !important;
  font-weight: 400;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(90deg, #ff9b47, #ff6b2c);
  box-shadow: 0 14px 28px rgba(255, 122, 69, 0.3);
  z-index: 20;
  animation: floatPulse 1.8s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

.go-draw-fab img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  position: relative;
}
.text {
  position: absolute;
  display: flex;
  color: #ffffff;
  font-size: 12px;
  width: 100%;
  top: 80%;
  left: 70%;
  transform: translate(-50%, -50%);
}

@keyframes floatPulse {
  0%,
  100% {
    transform: translateY(0);
    box-shadow: 0 14px 28px rgba(255, 122, 69, 0.3);
  }
  50% {
    transform: translateY(-2px);
    box-shadow: 0 18px 34px rgba(255, 122, 69, 0.38);
  }
}
</style>
