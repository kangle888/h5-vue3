<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { showFailToast, showSuccessToast } from "vant";
import {
  codeLoginApi,
  loginPasswordApi,
  sendCodeApi,
  type ICAuthLoginResult
} from "@/api/c-auth";

defineOptions({ name: "Login" });

const router = useRouter();
const loading = ref(false);
const codeLoading = ref(false);
const mode = ref<"password" | "verify">("password");
const codeCountDown = ref(0);
let codeTimer: number | null = null;

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

const clearCodeTimer = () => {
  if (codeTimer) {
    clearInterval(codeTimer);
    codeTimer = null;
  }
};

const startCodeCountDown = () => {
  clearCodeTimer();
  codeCountDown.value = 60;
  codeTimer = window.setInterval(() => {
    if (codeCountDown.value <= 1) {
      codeCountDown.value = 0;
      clearCodeTimer();
      return;
    }
    codeCountDown.value -= 1;
  }, 1000);
};

const sendCode = async () => {
  if (codeCountDown.value > 0 || codeLoading.value) {
    return;
  }
  if (!/^1\d{10}$/.test(form.mobile)) {
    showFailToast("请输入正确手机号");
    return;
  }
  codeLoading.value = true;
  try {
    await sendCodeApi({
      mobile: form.mobile,
      bizType: "LOGIN"
    });
    showSuccessToast("验证码已发送");
    startCodeCountDown();
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

  loading.value = true;
  try {
    const res = await codeLoginApi({
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

onBeforeUnmount(() => {
  clearCodeTimer();
});
</script>

<template>
  <div
    class="login-wrapper relative min-h-screen w-full box-border px-8 py-10 flex flex-col justify-center"
  >
    <!-- Hero Section -->
    <div class="hero-section mb-12">
      <h1 class="text-3xl font-bold text-white leading-tight tracking-wide">
        遇见心动<br />专属陪玩
      </h1>
      <p class="mt-3 text-[14px] text-gray-400 leading-relaxed">
        高颜值真人在线，随时随地开启你的专属游戏派对
      </p>
    </div>

    <!-- Form Container -->
    <div class="form-container">
      <div class="mb-8 flex items-center justify-between">
        <h2 class="text-xl font-medium text-white tracking-wide">
          {{ mode === "password" ? "密码登录" : "快捷登录" }}
        </h2>
      </div>

      <van-form @submit="onSubmit">
        <!-- Mobile Field -->
        <van-field
          v-model="form.mobile"
          name="mobile"
          placeholder="请输入手机号"
          clearable
          class="custom-field"
        />

        <!-- Code Field -->
        <van-field
          v-if="mode === 'verify'"
          v-model="form.code"
          name="code"
          placeholder="请输入验证码"
          clearable
          class="custom-field"
        >
          <template #button>
            <span
              class="get-code-text"
              :class="{ 'opacity-50 pointer-events-none': codeLoading || codeCountDown > 0 }"
              @click="sendCode"
            >
              {{ codeLoading ? "获取中..." : codeCountDown > 0 ? `${codeCountDown}s后重试` : "获取验证码" }}
            </span>
          </template>
        </van-field>

        <!-- Password Field -->
        <van-field
          v-model="form.password"
          name="password"
          type="password"
          :placeholder="
            mode === 'verify' ? '首次登录可设置密码(非必填)' : '请输入密码'
          "
          clearable
          class="custom-field"
        />

        <div class="pt-10">
          <van-button
            block
            native-type="submit"
            :loading="loading"
            :disabled="loading"
            class="submit-btn"
          >
            <span class="text-[16px] font-bold text-[#111]">
              {{ mode === "password" ? "立即登录" : "验证并登录" }}
            </span>
          </van-button>
        </div>
      </van-form>

      <div class="mt-6 text-center">
        <span
          class="text-[13px] text-gray-500 active:text-gray-300 transition-colors cursor-pointer inline-block py-2"
          @click="switchMode(mode === 'password' ? 'verify' : 'password')"
        >
          {{ mode === "password" ? "免密快捷登录 / 注册" : "使用已有密码登录" }}
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-auto pt-10 text-center text-[12px] text-gray-600">
      登录即代表同意
      <span class="text-gray-400 active:text-gray-300">用户协议</span> 和
      <span class="text-gray-400 active:text-gray-300">隐私政策</span>
    </div>
  </div>
</template>

<style scoped lang="less">
.login-wrapper {
  background-color: #000000;
}

:deep(.custom-field) {
  background: transparent !important;
  padding: 16px 0;
  border-bottom: 1px solid #222;
  margin-bottom: 8px;

  &::after {
    display: none;
  }

  .van-field__control {
    color: #fff !important;
    font-size: 16px;
    &::placeholder {
      color: #555 !important;
    }
  }

  .van-field__clear {
    color: #555;
  }
}

.get-code-text {
  font-size: 14px;
  color: #dfc293; /* Goldish color matching reference buttons */
  cursor: pointer;
  padding-left: 16px;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 14px;
    background-color: #333;
  }
}

:deep(.submit-btn) {
  background: linear-gradient(90deg, #dfc293 0%, #d1ae75 100%) !important;
  border: none !important;
  height: 48px;
  border-radius: 24px !important;
  transition: opacity 0.3s ease;
}

:deep(.submit-btn:active) {
  opacity: 0.8;
}

:deep(.submit-btn::before) {
  display: none;
}
</style>
