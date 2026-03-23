<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { showFailToast, showSuccessToast } from "vant";
import { useDarkMode } from "@/composables/useToggleDarkMode";
import { loginApi } from "@/api/sys-user";

defineOptions({ name: "Login" });

const router = useRouter();
const loading = ref(false);

const form = reactive({
  username: "admin",
  password: "xkl@2025"
});

const onSubmit = async () => {
  if (!form.username.trim()) {
    showFailToast("请输入用户名");
    return;
  }
  if (!form.password.trim()) {
    showFailToast("请输入密码");
    return;
  }

  loading.value = true;
  try {
    const res = await loginApi({
      username: form.username,
      password: form.password
    });

    if (res?.token) {
      localStorage.setItem("token", res.token);
    }
    localStorage.setItem("userInfo", JSON.stringify(res?.sysUser ?? {}));

    showSuccessToast("登录成功");
    router.replace({ name: "Demo" });
  } catch (error) {
    showFailToast("登录失败，请检查账号密码或后端服务");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <van-config-provider :theme="useDarkMode() ? 'dark' : 'light'">
    <div class="login-page">
      <div class="login-card">
        <h1 class="title">欢迎登录</h1>
        <p class="subtitle">Player H5</p>

        <van-form @submit="onSubmit">
          <van-cell-group inset>
            <van-field
              v-model="form.username"
              name="username"
              label="账号"
              placeholder="请输入账号"
              clearable
            />
            <van-field
              v-model="form.password"
              name="password"
              type="password"
              label="密码"
              placeholder="请输入密码"
              clearable
            />
          </van-cell-group>

          <div class="mt-[20px]">
            <van-button
              round
              block
              type="primary"
              native-type="submit"
              :loading="loading"
              :disabled="loading"
            >
              登录
            </van-button>
          </div>
        </van-form>
      </div>
    </div>
  </van-config-provider>
</template>

<style scoped lang="less">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(180deg, #f5f8ff 0%, #ffffff 60%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 24px 18px;
  border-radius: 16px;
  background: var(--color-background);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.title {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: #8c8c8c;
  text-align: center;
  margin: 8px 0 18px;
}
</style>
