<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import drawIcon from "@/assets/img1.png";

const router = useRouter();
const inviteCode = ref("");
// 从 URL hash 中解析邀请码（分享链接直达 /activity/home?invite_code=xxx）
const urlInviteCode = ref("");

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
    image: "https://xklandlxy.art/images/activity1.jpg"
  }
];

const currentBanner = ref(0);

// 是否是被邀请进来的（URL中带了invite_code且与自己不同）
const isInvited = computed(() => {
  return !!urlInviteCode.value && urlInviteCode.value !== inviteCode.value;
});

const goDraw = () => {
  // 跳转时把 invite_code 带给抽奖页
  if (urlInviteCode.value) {
    router.push({
      path: "/activity/draw",
      query: { invite_code: urlInviteCode.value }
    });
  } else {
    router.push("/activity/draw");
  }
};

onMounted(() => {
  // 读取本地已有的 invite_code
  const stored = localStorage.getItem("activity_invite_code") || "";
  inviteCode.value = stored;

  // 从 URL hash 中解析 invite_code（分享链接带来的）
  // URL 形如 /#/activity/home?invite_code=XXXXXXXX
  const hashSearch = window.location.hash.split("?")[1] || "";
  const params = new URLSearchParams(hashSearch);
  const fromUrl = params.get("invite_code") || "";
  urlInviteCode.value = fromUrl;

  // 存到 sessionStorage，供抽奖页读取（路由跳转丢失时的备用）
  if (fromUrl) {
    sessionStorage.setItem("activity_from_invite_code", fromUrl);
  }
});
</script>

<template>
  <div class="home-page">
    <!-- 被邀请提示横幅 -->
    <div v-if="isInvited" class="invite-banner">
      <span class="invite-banner-icon">🎉</span>
      <span class="invite-banner-text">
        你的好友邀请你参与活动，点击下方按钮一起抽奖！
      </span>
    </div>

    <van-swipe
      class="home-swipe"
      :autoplay="3000"
      @change="index => (currentBanner = index)"
      indicator-color="#fff"
    >
      <van-swipe-item v-for="banner in banners" :key="banner.key">
        <div class="home-banner">
          <img class="home-banner-img" :src="banner.image" />
          <!-- 底部渐变遮罩文案 -->
          <!-- <div class="home-banner-copy">
            <div class="home-badge">限时活动</div>
            <p>邀请好友一起来，赢取大奖</p>
          </div> -->
        </div>
      </van-swipe-item>
    </van-swipe>

    <!-- 去抽奖悬浮按钮 -->
    <div class="go-draw-fab" @click="goDraw">
      <img :src="drawIcon" alt="" />
      <div class="go-draw-label">去抽奖</div>
    </div>
  </div>
</template>

<style scoped lang="less">
.home-page {
  min-height: 100vh;
  padding: 0;
  background: #000;
  position: relative;
}

// 邀请横幅
.invite-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(90deg, #ff6b35, #ff4040);
  color: #fff;
  font-size: 13px;
  line-height: 1.5;
  box-shadow: 0 4px 16px rgba(255, 80, 0, 0.4);
  animation: slideDown 0.4s ease-out;
}
.invite-banner-icon {
  font-size: 18px;
  flex-shrink: 0;
}
.invite-banner-text {
  flex: 1;
  font-weight: 600;
}
@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.home-swipe {
  height: 100vh;
}

.home-banner {
  height: 100%;
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
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.05) 0%,
    rgba(0, 0, 0, 0.1) 80%,
    rgba(0, 0, 0, 0.65) 100%
  );
  z-index: 1;
}

.home-banner-copy {
  position: absolute;
  bottom: 250px;
  left: 0;
  right: 0;
  padding: 0 24px;
  z-index: 2;
  color: #fff;
}

.home-badge {
  display: inline-flex;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 100, 50, 0.85);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
  backdrop-filter: blur(4px);
}

.home-banner-copy h1 {
  margin: 0 0 8px;
  font-size: 30px;
  font-weight: 900;
  line-height: 1.2;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.home-banner-copy p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  opacity: 0.9;
}

// 去抽奖按钮
.go-draw-fab {
  position: fixed;
  right: 16px;
  bottom: 28px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff9b47, #ff4040);
  box-shadow: 0 8px 24px rgba(255, 80, 0, 0.5), 0 0 0 3px rgba(255,255,255,0.2);
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: floatPulse 2s ease-in-out infinite;
  -webkit-tap-highlight-color: transparent;
}

.go-draw-fab img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  display: block;
}

.go-draw-label {
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  margin-top: 2px;
  white-space: nowrap;
}

@keyframes floatPulse {
  0%, 100% {
    transform: translateY(0) scale(1);
    box-shadow: 0 8px 24px rgba(255, 80, 0, 0.5), 0 0 0 3px rgba(255,255,255,0.2);
  }
  50% {
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 14px 32px rgba(255, 80, 0, 0.6), 0 0 0 5px rgba(255,255,255,0.15);
  }
}
</style>
