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
  <div class="settings-page-wrapper min-h-screen w-full">
    <div class="box-border min-h-screen pb-10">
      <div class="top-bar">
        <div class="back-btn" @click="router.back()">
          <van-icon name="arrow-left" size="20" color="#fff" />
        </div>
        <span class="title">设置</span>
        <span class="placeholder-spacer"></span>
      </div>

      <div class="content-container">
        <!-- Group 1 -->
        <div class="group group-panel">
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
        <div class="group group-panel">
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
        <div class="group group-panel">
          <div class="cell clickable" @click="clearImageCache">
            <span class="label">清除图片缓存</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
        </div>

        <!-- Group 4 -->
        <div class="group group-panel">
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
  background-color: #000;
  color: #fff;
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
  background: #000;
  border-bottom: 1px solid #111;

  .title {
    font-size: 16px;
    font-weight: 500;
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

/* Base Panel */
.group-panel {
  background: #111;
  border-radius: 16px;
  overflow: hidden;
}

.cell {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid #222;
  transition: background 0.2s;

  &.clickable:active {
    background: #1a1a1a;
  }
}

.cell:last-child {
  border-bottom: none;
}

.label {
  font-size: 15px;
  font-weight: 500;
  color: #e5e5e5;
}

.value {
  color: #999;
  font-size: 14px;
}

.arrow-icon {
  color: #666;
  font-size: 16px;
}

.logout-btn {
  margin-top: 24px;
  width: 100%;
  height: 54px;
  border-radius: 16px;
  border: none;
  background: #1a1a1a;
  color: #ef4444;
  font-size: 16px;
  font-weight: 600;
  border: 1px solid #331111;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.97);
    background: #2a1111;
  }
}
</style>
