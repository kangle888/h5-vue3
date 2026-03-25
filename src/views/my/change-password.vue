<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { showFailToast, showSuccessToast } from "vant";
import { changePasswordApi } from "@/api/c-auth";

defineOptions({ name: "ChangePassword" });

const router = useRouter();
const loading = ref(false);
const form = reactive({
  oldPassword: "",
  newPassword: ""
});

const onSubmit = async () => {
  if (form.oldPassword.length < 6 || form.newPassword.length < 6) {
    showFailToast("密码至少6位");
    return;
  }
  loading.value = true;
  try {
    await changePasswordApi({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
      deviceId: localStorage.getItem("c_device_id") || "default_device"
    });
    showSuccessToast("修改成功");
    router.back();
  } catch {
    showFailToast("修改失败，请检查旧密码");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="change-page">
    <div class="top-bar">
      <van-icon name="arrow-left" size="20" @click="router.back()" />
      <span class="title">修改密码</span>
      <span style="width: 20px"></span>
    </div>

    <div class="form-box">
      <van-cell-group inset>
        <van-field v-model="form.oldPassword" type="password" label="旧密码" placeholder="请输入旧密码" />
        <van-field v-model="form.newPassword" type="password" label="新密码" placeholder="请输入新密码" />
      </van-cell-group>

      <div class="btn-wrap">
        <van-button block round type="primary" :loading="loading" @click="onSubmit">保存</van-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.change-page {
  --van-cell-background: #111;
  --van-border-color: #222;
  --van-cell-text-color: #e5e5e5;
  --van-field-label-color: #e5e5e5;
  --van-cell-value-color: #fff;
  --van-field-input-text-color: #fff;
  --van-field-placeholder-text-color: #666;
  --van-button-primary-background: #dfc293;
  --van-button-primary-border-color: #dfc293;
  --van-button-primary-color: #000;
  
  min-height: 100vh;
  background: #000;
  color: #fff;
}

.top-bar {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #111;

  .title {
    font-size: 16px;
    font-weight: 500;
  }
}

.form-box {
  margin-top: 16px;
}

.btn-wrap {
  margin: 24px 16px 0;
  
  :deep(.van-button) {
    font-weight: 600;
    border-radius: 12px;
  }
}
</style>
