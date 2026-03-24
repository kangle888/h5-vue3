<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getAttachmentDownloadUrl, getCurrentCUserApi, type ICUserProfile } from "@/api/c-user";

defineOptions({ name: "My" });

const router = useRouter();
const profile = ref<ICUserProfile>({});

const avatarUrl = () => getAttachmentDownloadUrl(profile.value.avatar);

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
  <div class="my-page-wrapper relative min-h-screen w-full overflow-hidden">
    <!-- Animated background elements -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="relative z-10 box-border min-h-screen p-4 pb-20">
      <div class="header-card glass-panel">
        <div class="avatar-wrap">
          <img v-if="avatarUrl()" :src="avatarUrl()" class="avatar" alt="avatar" />
          <div v-else class="avatar placeholder"></div>
        </div>
        <div class="info">
          <div class="name-row">
            <span class="name">{{ profile.nickname || "未设置昵称" }}</span>
            <span class="id">ID: {{ profile.id || "-" }}</span>
          </div>
          <div class="meta">{{ profile.age || "-" }}岁 · {{ profile.constellation || "-" }} · {{ profile.occupation || "-" }}</div>
          <div class="intro">{{ profile.introduction || "你还没有签名~" }}</div>
        </div>
        <button class="edit-btn" @click="router.push({ name: 'MyEdit' })">编辑资料</button>
      </div>

      <div class="stats-card glass-panel">
        <div class="stat-item">
          <div class="num text-gradient">0</div>
          <div class="label">钱包</div>
        </div>
        <div class="divider"></div>
        <div class="stat-item">
          <div class="num text-gradient">1</div>
          <div class="label">心动女生</div>
        </div>
      </div>

      <div class="entry-list glass-panel">
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
      </div>
      
      <!-- Footer or Version -->
      <div class="mt-8 text-center text-[11px] text-white/30 tracking-widest">
        探索你的专属陪伴 v1.0.0
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.my-page-wrapper {
  background-color: #0f0c29;
  background: linear-gradient(to bottom right, #0f0c29, #302b63, #24243e);
  color: #fff;
}

/* Base shape for energetic aesthetic */
.bg-shape {
  position: absolute;
  filter: blur(80px);
  border-radius: 50%;
  z-index: 1;
  opacity: 0.55;
  animation: float 10s infinite ease-in-out alternate;
  pointer-events: none;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: rgba(236, 72, 153, 0.3); /* Pink */
  top: -80px;
  right: -50px;
}

.shape-2 {
  width: 350px;
  height: 350px;
  background: rgba(139, 92, 246, 0.3); /* Violet */
  top: 30%;
  left: -100px;
  animation-delay: -3s;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: rgba(56, 189, 248, 0.2); /* Sky Blue */
  bottom: 0px;
  right: 10%;
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(30px) scale(1.05); }
}

/* Glassmorphism Panel Base */
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
  border-radius: 20px;
}

/* Header Card */
.header-card {
  padding: 20px 16px;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin-top: 10px;
}

.avatar-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6, #38bdf8);
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #111;
  border: 2px solid #1a1a1a;
}

.placeholder {
  background: #1a1a1a;
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
  gap: 8px;
  min-width: 0;
}

.name {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
  color: #fff;
}

.id {
  color: rgba(255,255,255,0.4);
  font-size: 11px;
  white-space: nowrap;
  background: rgba(255,255,255,0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.meta {
  margin-top: 6px;
  color: rgba(255,255,255,0.7);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.intro {
  margin-top: 6px;
  color: rgba(255,255,255,0.4);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.edit-btn {
  border: 1px solid rgba(236, 72, 153, 0.4);
  color: #fbcfe8;
  background: rgba(236, 72, 153, 0.1);
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  transition: all 0.3s;
  
  &:active {
    background: rgba(236, 72, 153, 0.2);
    transform: scale(0.95);
  }
}

/* Stats Card */
.stats-card {
  margin-top: 16px;
  padding: 20px 0;
  display: flex;
  align-items: center;
}

.divider {
  width: 1px;
  height: 40px;
  background: rgba(255,255,255,0.1);
}

.stat-item {
  flex: 1;
  text-align: center;

  .num {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.2;
  }

  .text-gradient {
    background: linear-gradient(135deg, #fcd34d, #f59e0b, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .label {
    margin-top: 6px;
    color: rgba(255,255,255,0.6);
    font-size: 13px;
  }
}

/* Entry List */
.entry-list {
  margin-top: 16px;
  padding: 4px 0;
  overflow: hidden;
}

.entry {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
  cursor: pointer;
  
  &:active {
    background: rgba(255,255,255,0.08);
  }
}

.entry:last-child {
  border-bottom: none;
}

.entry-left {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  
  .entry-icon {
    font-size: 18px;
    color: #a78bfa;
    background: rgba(167, 139, 250, 0.15);
    padding: 6px;
    border-radius: 8px;
  }
}

.entry-arrow {
  color: rgba(255, 255, 255, 0.3);
  font-size: 16px;
}
</style>
