<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { showFailToast, showSuccessToast } from "vant";
import {
  loginPasswordApi,
  registerOrBindApi,
  sendCodeApi,
  type ICAuthLoginResult
} from "@/api/c-auth";

defineOptions({ name: "Login" });

const router = useRouter();
const loading = ref(false);
const codeLoading = ref(false);
const mode = ref<"password" | "verify">("password");

const form = reactive({
  mobile: "",
  password: "",
  code: ""
});

const getDeviceId = () => {
  let id = localStorage.getItem("c_device_id");
  if (!id) {
    id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("c_device_id", id);
  }
  return id;
};

const saveLogin = (res: ICAuthLoginResult, mobile: string) => {
  localStorage.setItem("c_access_token", res?.accessToken || "");
  localStorage.setItem("c_refresh_token", res?.refreshToken || "");
  localStorage.setItem("c_user_info", JSON.stringify(res?.userInfo || {}));
  localStorage.setItem("c_last_mobile", mobile);
};

const switchMode = (nextMode: "password" | "verify") => {
  mode.value = nextMode;
  form.code = "";
};

const sendCode = async () => {
  if (!/^1\d{10}$/.test(form.mobile)) {
    showFailToast("请输入正确手机号");
    return;
  }
  codeLoading.value = true;
  try {
    const code = await sendCodeApi({
      mobile: form.mobile,
      bizType: "REGISTER"
    });
    showSuccessToast(`验证码已发送（模拟）: ${code}`);
  } catch {
    showFailToast("发送失败，请稍后重试");
  } finally {
    codeLoading.value = false;
  }
};

const submitPassword = async () => {
  if (!/^1\d{10}$/.test(form.mobile)) {
    showFailToast("请输入正确手机号");
    return;
  }
  if (form.password.length < 6) {
    showFailToast("密码至少6位");
    return;
  }

  loading.value = true;
  try {
    const res = await loginPasswordApi({
      mobile: form.mobile,
      password: form.password,
      deviceId: getDeviceId()
    });
    saveLogin(res, form.mobile);
    showSuccessToast("登录成功");
    router.replace({ name: "Home" });
  } catch {
    showFailToast("密码登录失败，若首次请走验证码验证");
    switchMode("verify");
  } finally {
    loading.value = false;
  }
};

const submitVerify = async () => {
  if (!/^1\d{10}$/.test(form.mobile)) {
    showFailToast("请输入正确手机号");
    return;
  }
  if (!form.code.trim()) {
    showFailToast("请输入验证码");
    return;
  }
  if (form.password.length < 6) {
    showFailToast("密码至少6位");
    return;
  }

  loading.value = true;
  try {
    const res = await registerOrBindApi({
      mobile: form.mobile,
      code: form.code,
      password: form.password,
      deviceId: getDeviceId()
    });
    saveLogin(res, form.mobile);
    showSuccessToast("验证成功，已登录");
    router.replace({ name: "Home" });
  } catch {
    showFailToast("验证失败，请检查验证码");
  } finally {
    loading.value = false;
  }
};

const onSubmit = async () => {
  if (mode.value === "password") {
    await submitPassword();
  } else {
    await submitVerify();
  }
};

onMounted(() => {
  const lastMobile = localStorage.getItem("c_last_mobile") || "";
  form.mobile = lastMobile;
  mode.value = lastMobile ? "password" : "verify";
});
</script>

<template>
  <div class="login-page">
    <!-- <div class="hero-card">
      <div class="slogan">附近高颜值 · 真人在线</div>
      <h1 class="title">陪玩匹配平台</h1>
      <p class="desc">首次登录：手机号 + 验证码 + 密码；后续手机号 + 密码</p>
    </div> -->

    <div class="form-card">
      <div class="form-title">
        {{ mode === "password" ? "手机号密码登录" : "手机号验证码验证" }}
      </div>

      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field v-model="form.mobile" name="mobile" label="手机号" placeholder="请输入手机号" clearable />

          <van-field
            v-if="mode === 'verify'"
            v-model="form.code"
            name="code"
            label="验证码"
            placeholder="请输入验证码"
            clearable
          >
            <template #button>
              <van-button size="small" type="primary" :loading="codeLoading" @click="sendCode">获取验证码</van-button>
            </template>
          </van-field>

          <van-field
            v-model="form.password"
            name="password"
            type="password"
            label="密码"
            :placeholder="mode === 'verify' ? '请设置登录密码' : '请输入密码'"
            clearable
          />
        </van-cell-group>

        <div class="mt-[20px]">
          <van-button round block type="primary" native-type="submit" :loading="loading" :disabled="loading">
            {{ mode === "password" ? "登录" : "验证并登录" }}
          </van-button>
        </div>
      </van-form>

      <div class="switch-row">
        <span v-if="mode === 'password'" @click="switchMode('verify')">首次登录/忘记密码？去验证码验证</span>
        <span v-else @click="switchMode('password')">返回手机号密码登录</span>
      </div>
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

.switch-row {
  margin-top: 12px;
  text-align: center;
  color: #1777ff;
  font-size: 13px;
}
</style>
