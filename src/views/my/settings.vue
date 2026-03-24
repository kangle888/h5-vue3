<script setup lang="ts">
import { useRouter } from "vue-router";
import { showConfirmDialog, showSuccessToast } from "vant";
import { logoutApi } from "@/api/c-auth";
import { getCurrentCUserApi } from "@/api/c-user";
import { ref } from "vue";

defineOptions({ name: "MySettings" });

const router = useRouter();
const mobile = ref("");

const loadUser = async () => {
  const res = await getCurrentCUserApi();
  mobile.value = res?.mobile || "";
};
loadUser();

const clearImageCache = () => {
  showSuccessToast("已清除图片缓存");
};

const onLogout = async () => {
  await showConfirmDialog({ title: "提示", message: "确定退出登录吗？" });
  await logoutApi({ deviceId: localStorage.getItem("c_device_id") || "default_device" });
  localStorage.removeItem("c_access_token");
  localStorage.removeItem("c_refresh_token");
  localStorage.removeItem("c_user_info");
  showSuccessToast("已退出");
  router.replace({ name: "Login" });
};
</script>

<template>
  <div class="settings-page-wrapper relative min-h-screen w-full overflow-hidden">
    <!-- Animated background elements -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="relative z-10 box-border min-h-screen pb-10">
      <div class="top-bar">
        <div class="back-btn" @click="router.back()">
          <van-icon name="arrow-left" size="20" color="#fff" />
        </div>
        <span class="title">设置</span>
        <span class="placeholder-spacer"></span>
      </div>

      <div class="content-container">
        <!-- Group 1 -->
        <div class="group glass-panel">
          <div class="cell">
            <span class="label">手机号码</span>
            <span class="value">{{ mobile || "-" }} <span class="text-xs opacity-50 ml-1">(仅自己可见)</span></span>
          </div>
          <div class="cell clickable" @click="router.push({ name: 'ChangePassword' })">
            <span class="label">修改密码</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="cell clickable">
            <span class="label">注销账号</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>

        <!-- Group 2 -->
        <div class="group glass-panel">
          <div class="cell clickable">
            <span class="label">隐私设置</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="cell clickable">
            <span class="label">消息推送设置</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="cell clickable">
            <span class="label">显示模式</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="cell clickable">
            <span class="label">黑名单</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="cell clickable">
            <span class="label">我的印象</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>

        <!-- Group 3 -->
        <div class="group glass-panel">
          <div class="cell clickable" @click="clearImageCache">
            <span class="label">清除图片缓存</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>

        <!-- Group 4 -->
        <div class="group glass-panel">
          <div class="cell clickable">
            <span class="label">关于我们</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="cell clickable">
            <span class="label">已收集个人信息清单</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="cell clickable">
            <span class="label">第三方共享个人信息清单</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="cell">
            <span class="label">当前版本</span>
            <span class="value">1.3.4.2</span>
          </div>
        </div>

        <button class="logout-btn" @click="onLogout">退出登录</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.settings-page-wrapper {
  background-color: #0f0c29;
  background: linear-gradient(to bottom right, #0f0c29, #302b63, #24243e);
  color: #fff;
}

/* Background floating shapes */
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
  background: rgba(236, 72, 153, 0.35); /* Pink */
  top: -50px;
  right: -50px;
}

.shape-2 {
  width: 350px;
  height: 350px;
  background: rgba(139, 92, 246, 0.35); /* Violet */
  top: 40%;
  left: -100px;
  animation-delay: -3s;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: rgba(56, 189, 248, 0.25); /* Sky Blue */
  bottom: -50px;
  right: 20%;
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(30px) scale(1.05); }
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(15, 12, 41, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  .title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 1px;
  }
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.placeholder-spacer {
  width: 32px;
}

.content-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Glassmorphism Panel Base */
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  overflow: hidden;
}

.cell {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.2s;

  &.clickable:active {
    background: rgba(255, 255, 255, 0.1);
  }
}

.cell:last-child {
  border-bottom: none;
}

.label {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.value {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.arrow-icon {
  color: rgba(255, 255, 255, 0.3);
  font-size: 16px;
}

.logout-btn {
  margin-top: 24px;
  width: 100%;
  height: 54px;
  border-radius: 27px;
  border: none;
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 2px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.97);
    background: rgba(239, 68, 68, 0.25);
  }
}
</style>
