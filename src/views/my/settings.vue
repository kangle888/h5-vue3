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
  <div class="settings-page">
    <div class="top-bar">
      <van-icon name="arrow-left" size="20" @click="router.back()" />
      <span>设置</span>
      <span style="width: 20px"></span>
    </div>

    <div class="group">
      <div class="cell"><span>手机号码</span><span class="value">{{ mobile || "-" }}(仅自己可见)</span></div>
      <div class="cell" @click="router.push({ name: 'ChangePassword' })"><span>修改密码</span><span>›</span></div>
      <div class="cell"><span>注销账号</span><span>›</span></div>
    </div>

    <div class="group">
      <div class="cell"><span>隐私设置</span><span>›</span></div>
      <div class="cell"><span>消息推送设置</span><span>›</span></div>
      <div class="cell"><span>显示模式</span><span>›</span></div>
      <div class="cell"><span>黑名单</span><span>›</span></div>
      <div class="cell"><span>我的印象</span><span>›</span></div>
    </div>

    <div class="group">
      <div class="cell" @click="clearImageCache"><span>清除图片缓存</span><span>›</span></div>
    </div>

    <div class="group">
      <div class="cell"><span>关于我们</span><span>›</span></div>
      <div class="cell"><span>已收集个人信息清单</span><span>›</span></div>
      <div class="cell"><span>第三方共享个人信息清单</span><span>›</span></div>
      <div class="cell"><span>当前版本</span><span class="value">1.3.4.2</span></div>
    </div>

    <button class="logout-btn" @click="onLogout">退出登录</button>
  </div>
</template>

<style scoped lang="less">
.settings-page {
  min-height: 100vh;
  background: #090a0d;
  color: #fff;
}
.top-bar {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #1f2024;
}
.group {
  margin-top: 10px;
  background: #101114;
  border-top: 1px solid #1f2024;
  border-bottom: 1px solid #1f2024;
}
.cell {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid #1f2024;
}
.cell:last-child {
  border-bottom: none;
}
.value {
  color: #9da0ab;
}
.logout-btn {
  width: 100%;
  margin-top: 14px;
  height: 52px;
  border: none;
  background: #101114;
  color: #fff;
  font-size: 20px;
}
</style>
