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
      <span>修改密码</span>
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

.form-box {
  margin-top: 16px;
}

.btn-wrap {
  margin: 18px 14px 0;
}
</style>
