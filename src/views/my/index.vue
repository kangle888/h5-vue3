<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { showFailToast, showSuccessToast } from "vant";
import { useRouter } from "vue-router";
import {
  getAttachmentDownloadUrl,
  getCurrentCUserApi,
  type ICUserProfile
} from "@/api/c-user";

defineOptions({ name: "My" });

const router = useRouter();
const profile = ref<ICUserProfile>({});

const avatarUrl = () => getAttachmentDownloadUrl(profile.value.avatar);

const landingPath = "#/landingPage";
const landingUrl = computed(
  () => `${window.location.origin}${window.location.pathname}${landingPath}`
);
const qrUrl = computed(() => {
  const data = encodeURIComponent(landingUrl.value);
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${data}`;
});
const showSharePopup = ref(false);

const shareLandingPage = async () => {
  const shareData = {
    title: "初见",
    text: "扫码或点击链接进下载初见App",
    url: landingUrl.value
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(landingUrl.value);
    showSuccessToast("落地页链接已复制");
  } catch {
    showFailToast("分享失败，请稍后重试");
  }
};

const loadProfile = async () => {
  try {
    profile.value = (await getCurrentCUserApi()) || {};
  } catch {
    profile.value = {};
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="my-page-wrapper w-full">
    <div class="header-card">
      <div class="avatar-wrap">
        <img v-if="avatarUrl()" :src="avatarUrl()" class="avatar" alt="avatar" />
        <div v-else class="avatar placeholder">
          <van-icon name="user-circle-o" size="32" color="#666" />
        </div>
      </div>
      <div class="info">
        <div class="name-row">
          <span class="name">{{ profile.nickname || "未设置昵称" }}</span>
          <span class="id">ID: {{ profile.id || "-" }}</span>
        </div>
        <div class="meta">
          {{ profile.age || "-" }}岁 · {{ profile.constellation || "-" }} ·
          {{ profile.occupation || "-" }}
        </div>
        <div class="intro">{{ profile.introduction || "你还没有签名~" }}</div>
      </div>
      <button class="edit-btn" @click="router.push({ name: 'MyEdit' })">
        编辑资料
      </button>
    </div>

    <div class="stats-card">
      <!-- <div class="stat-item">
        <div class="num gold-text">0</div>
        <div class="label">钱包</div>
      </div>
      <div class="divider"></div> -->
      <div class="stat-item">
        <div class="num gold-text">1</div>
        <div class="label">心动女生</div>
      </div>
    </div>

    <div class="entry-list">
      <div class="entry" @click="router.push({ name: 'MySettings' })">
        <div class="entry-left">
          <van-icon name="setting-o" class="entry-icon" />
          <span>通用设置</span>
        </div>
        <van-icon name="arrow" class="entry-arrow" />
      </div>
      <div class="entry" @click="router.push({ name: 'ChangePassword' })">
        <div class="entry-left">
          <van-icon name="lock" class="entry-icon" />
          <span>修改密码</span>
        </div>
        <van-icon name="arrow" class="entry-arrow" />
      </div>
      <div class="entry" @click="showSharePopup = true">
        <div class="entry-left">
          <van-icon name="share-o" class="entry-icon" />
          <span>App分享</span>
        </div>
        <van-icon name="arrow" class="entry-arrow" />
      </div>
    </div>

    <div class="mt-12 text-center text-[11px] text-[#666] tracking-widest">
      探索你的专属陪伴 v1.0.0
    </div>

    <van-popup v-model:show="showSharePopup" round position="bottom" class="dark-popup">
      <div class="share-popup">
        <div class="popup-header">
          <span class="popup-title">遇见App分享</span>
          <van-icon name="cross" class="close-icon" @click="showSharePopup = false" />
        </div>

        <div class="share-card">
          <div class="qr-wrap">
            <div class="qr-bg">
              <van-image class="qr-image" fit="cover" :src="qrUrl" alt="landing-qrcode" />
            </div>
          </div>

          <button class="share-btn" @click="shareLandingPage">
            <van-icon name="share-o" size="16" />
            <span>立即分享链接</span>
          </button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped lang="less">
.my-page-wrapper {
  background-color: #000000;
  color: #fff;
  box-sizing: border-box;
  height: 100%;
  padding: 16px 16px 24px;
}

/* Header Card */
.header-card {
  padding: 24px 20px;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  margin-top: 10px;
  background: #111;
  border-radius: 16px;
}

.avatar-wrap {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #1a1a1a;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.name-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.name {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
  color: #fff;
}

.id {
  color: #888;
  font-size: 11px;
  white-space: nowrap;
  background: #222;
  padding: 2px 6px;
  border-radius: 4px;
}

.meta {
  margin-top: 6px;
  color: #999;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.intro {
  margin-top: 6px;
  color: #666;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-btn {
  border: 1px solid #dfc293;
  color: #dfc293;
  background: transparent;
  border-radius: 12px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;

  &:active {
    background: rgba(223, 194, 147, 0.1);
  }
}

/* Stats Card */
.stats-card {
  margin-top: 16px;
  padding: 24px 0;
  display: flex;
  align-items: center;
  background: #111;
  border-radius: 16px;
}

.divider {
  width: 1px;
  height: 40px;
  background: #222;
}

.stat-item {
  flex: 1;
  text-align: center;

  .num {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
  }

  .gold-text {
    color: #dfc293;
  }

  .label {
    margin-top: 6px;
    color: #999;
    font-size: 13px;
  }
}

/* Entry List */
.entry-list {
  margin-top: 16px;
  padding: 8px 0;
  background: #111;
  border-radius: 16px;
}

.entry {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  transition: background 0.2s;
  cursor: pointer;

  &:active {
    background: #1a1a1a;
  }
}

.entry-left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: #e5e5e5;
  font-weight: 500;

  .entry-icon {
    font-size: 18px;
    color: #dfc293;
    background: rgba(223, 194, 147, 0.1);
    padding: 6px;
    border-radius: 8px;
  }
}

.entry-arrow {
  color: #666;
  font-size: 16px;
}

:deep(.dark-popup) {
  background: #111;
  color: #fff;
}

.share-popup {
  padding: 0 0 calc(50px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #222;

  .popup-title {
    font-size: 17px;
    font-weight: 600;
    color: #fff;
  }

  .close-icon {
    font-size: 20px;
    color: #666;
    padding: 4px;

    &:active {
      opacity: 0.7;
    }
  }
}

.share-card {
  padding: 30px 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-wrap {
  display: flex;
  justify-content: center;
}

.qr-bg {
  padding: 12px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.qr-image {
  width: 180px;
  height: 180px;
  display: block;
}

.qr-tip {
  margin-top: 20px;
  font-size: 13px;
  color: #999;
}

.share-btn {
  margin-top: 32px;
  width: 100%;
  height: 48px;
  border-radius: 24px;
  background: #dfc293;
  color: #000;
  border: none;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:active {
    transform: scale(0.96);
    opacity: 0.9;
  }
}
</style>
