<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { showFailToast, showSuccessToast } from "vant";
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
    router.replace({ name: "Home" });
  } catch (error) {
    showFailToast("登录失败，请检查账号密码或后端服务");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <div class="hero-card">
      <div class="slogan">附近高颜值 · 真人在线</div>
      <h1 class="title">陪玩匹配平台</h1>
      <p class="desc">快速找到合适的陪玩搭子，随时随地开启高质量互动。</p>
    </div>

    <div class="form-card">
      <div class="form-title">账号登录</div>
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field v-model="form.username" name="username" label="账号" placeholder="请输入账号" clearable />
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
          <van-button round block type="primary" native-type="submit" :loading="loading" :disabled="loading">
            进入首页
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<style scoped lang="less">
.login-page {
  min-height: 100vh;
  padding: 26px 16px;
  background:
    radial-gradient(120% 60% at 50% 0%, rgba(234, 193, 122, 0.22), transparent 65%),
    linear-gradient(180deg, #0d0d0e 0%, #121214 46%, #171717 100%);
}

.hero-card {
  margin-top: 14px;
  padding: 24px 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(4px);

  .slogan {
    display: inline-block;
    font-size: 12px;
    color: #23190b;
    background: #dcbc83;
    border-radius: 10px;
    padding: 4px 10px;
  }

  .title {
    margin: 12px 0 8px;
    color: #fff;
    font-size: 30px;
    font-weight: 800;
    line-height: 1.15;
  }

  .desc {
    margin: 0;
    color: #c3c3c3;
    font-size: 14px;
    line-height: 1.7;
  }
}

.form-card {
  margin-top: 18px;
  padding: 18px 14px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);

  .form-title {
    font-size: 18px;
    font-weight: 700;
    color: #1f1f1f;
    margin-bottom: 14px;
  }
}
</style>
