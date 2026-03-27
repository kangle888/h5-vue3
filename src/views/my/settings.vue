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

const onLogout = () => {
  showConfirmDialog({
    title: "退出登录",
    message: "确定退出当前账号吗？",
    showCancelButton: true,
    cancelButtonText: "取消",
    confirmButtonText: "确认"
  })
    .then(async () => {
      await logoutApi({
        deviceId: localStorage.getItem("c_device_id") || "default_device"
      });
      localStorage.removeItem("c_access_token");
      localStorage.removeItem("c_refresh_token");
      localStorage.removeItem("c_user_info");
      showSuccessToast("已退出");
      router.replace({ name: "Login" });
    })
    .catch(() => {
      // on cancel
    });
};
</script>

<template>
  <div class="settings-page-wrapper w-full">
    <div class="box-border">
      <!-- <div class="top-bar">
        <div class="back-btn" @click="router.back()">
          <van-icon name="arrow-left" size="20" color="#fff" />
        </div>
        <span class="title">设置</span>
        <span class="placeholder-spacer"></span>
      </div> -->
      <!-- <nav-bar :title="'设置'" :leftArrow="true" @click-left="router.back()" /> -->

      <div class="content-container">
        <!-- Group 1 -->
        <div class="group group-panel">
          <div class="cell">
            <span class="label">手机号码</span>
            <span class="value">{{ mobile || "-" }}
              <span class="text-xs opacity-50 ml-1">(仅自己可见)</span></span>
          </div>
          <div class="cell clickable" @click="router.push({ name: 'ChangePassword' })">
            <span class="label">修改密码</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <!-- <div class="cell clickable">
            <span class="label">注销账号</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div> -->
        </div>

        <!-- Group 2 -->
        <!-- <div class="group group-panel">
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
        </div> -->

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
          <!-- <div class="cell clickable">
            <span class="label">第三方共享个人信息清单</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div> -->
          <div class="cell">
            <span class="label">当前版本</span>
            <span class="value">1.0.0.1</span>
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
  box-sizing: border-box;
  height: 100%;
}

.box-border {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 50px;
}

.group {
  margin-bottom: 12px;
}

.group:last-of-type {
  margin-bottom: 0;
}

.group-panel {
  background: #0e0f12;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #1d1f24;
}

.cell {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid #1d1f24;
  transition: background 0.2s;

  &.clickable:active {
    background: #181a20;
  }
}

.cell:last-child {
  border-bottom: none;
}

.label {
  font-size: 15px;
  font-weight: 500;
  color: #f3f4f6;
}

.value {
  color: #9ca3af;
  font-size: 14px;
}

.arrow-icon {
  color: #6b7280;
  font-size: 16px;
}

.logout-btn {
  margin-top: 16px;
  width: 100%;
  height: 50px;
  border-radius: 14px;
  border: 1px solid #3b1a1a;
  background: #171717;
  color: #ef4444;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
    background: #221313;
  }
}

@supports (padding: env(safe-area-inset-bottom)) {
  .content-container {
    padding-bottom: calc(50px + env(safe-area-inset-bottom));
  }
}
</style>
