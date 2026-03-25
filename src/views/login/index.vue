<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { showFailToast, showSuccessToast } from "vant";
import { codeLoginApi, loginPasswordApi, sendCodeApi, type ICAuthLoginResult } from "@/api/c-auth";

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
    await sendCodeApi({
      mobile: form.mobile,
      bizType: "LOGIN"
    });
    showSuccessToast("验证码已发送");
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
</script>

<template>
  <div class="login-wrapper relative min-h-screen w-full overflow-hidden">
    <!-- Animated background elements -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>
    <div class="bg-shape shape-3"></div>

    <div class="relative z-10 box-border min-h-screen px-6 py-10 flex flex-col justify-center">
      <!-- Hero Section -->
      <div class="hero-section mb-10">
        <div class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 mb-4 border border-white/20 backdrop-blur-md">
          <span class="text-[12px] font-medium text-pink-300">🎉 新手福利</span>
          <span class="text-[12px] text-white/80">注册即可首单免费体验</span>
        </div>
        <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 leading-tight tracking-wide">
          遇见心动<br />专属陪玩
        </h1>
        <p class="mt-3 text-[14px] text-white/60 leading-relaxed">
          高颜值真人在线，随时随地开启你的专属游戏派对
        </p>
      </div>

      <!-- Form Card -->
      <div class="glass-card">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-xl font-bold text-white tracking-wide">
            {{ mode === "password" ? "密码登录" : "快捷登录" }}
          </h2>
        </div>

        <van-form @submit="onSubmit" class="space-y-4">
          <van-cell-group inset class="!m-0 !bg-transparent">
            <!-- Mobile Field -->
            <van-field
              v-model="form.mobile"
              name="mobile"
              placeholder="请输入手机号"
              clearable
              class="custom-input"
            />

            <!-- Code Field -->
            <van-field
              v-if="mode === 'verify'"
              v-model="form.code"
              name="code"
              placeholder="请输入验证码"
              clearable
              class="custom-input mt-4"
            >
              <template #button>
                <div
                   class="get-code-btn"
                   :class="{ 'opacity-50 pointer-events-none': codeLoading }"
                   @click="sendCode"
                >
                  {{ codeLoading ? '获取中...' : '短信验证码' }}
                </div>
              </template>
            </van-field>

            <!-- Password Field -->
            <van-field
               v-model="form.password"
               name="password"
               type="password"
               :placeholder="mode === 'verify' ? '首次登录请设置密码(非必填，存在用户可不填)' : '请输入密码'"
               clearable
               class="custom-input mt-4"
            />
          </van-cell-group>

          <div class="pt-6">
            <van-button
              round
              block
              native-type="submit"
              :loading="loading"
              :disabled="loading"
              class="submit-btn"
            >
              <span class="text-base font-bold tracking-widest text-white">
                {{ mode === "password" ? "立即登录" : "验证并登录" }}
              </span>
            </van-button>
          </div>
        </van-form>

        <div class="mt-6 text-center">
          <span
            class="text-[13px] text-white/50 hover:text-pink-300 transition-colors cursor-pointer inline-block border-b border-transparent hover:border-pink-300/50 pb-0.5"
            @click="switchMode(mode === 'password' ? 'verify' : 'password')"
          >
            {{ mode === "password" ? "免密快捷登录 / 注册" : "使用已有密码登录" }}
          </span>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-auto pt-10 text-center text-[12px] text-white/40">
        登录即代表同意 <span class="text-white/70">用户协议</span> 和 <span class="text-white/70">隐私政策</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.login-wrapper {
  background-color: #0f0c29;
  background: linear-gradient(to bottom right, #0f0c29, #302b63, #24243e);
}

/* Base shape for energetic aesthetic */
.bg-shape {
  position: absolute;
  filter: blur(80px);
  border-radius: 50%;
  z-index: 1;
  opacity: 0.55;
  animation: float 10s infinite ease-in-out alternate;
}

.shape-1 {
  width: 320px;
  height: 320px;
  background: rgba(236, 72, 153, 0.4); /* Pink */
  top: -60px;
  left: -80px;
}

.shape-2 {
  width: 250px;
  height: 250px;
  background: rgba(139, 92, 246, 0.4); /* Violet */
  bottom: 80px;
  right: -80px;
  animation-delay: -3s;
}

.shape-3 {
  width: 200px;
  height: 200px;
  background: rgba(56, 189, 248, 0.3); /* Sky Blue */
  top: 40%;
  left: 20%;
  animation-delay: -5s;
}

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(40px) scale(1.1); }
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

/* Deep overwrite of Vant Field */
:deep(.custom-input) {
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px;
  padding: 14px 18px;
  color: #fff;
  transition: all 0.3s ease;
  border: 1px solid transparent;

  /* Use modern transparent clear icon if possible, or force color */
  .van-field__clear {
    color: rgba(255, 255, 255, 0.5);
  }
}

:deep(.custom-input:focus-within) {
  background: rgba(255, 255, 255, 0.12) !important;
  border: 1px solid rgba(236, 72, 153, 0.5);
  box-shadow: 0 0 12px rgba(236, 72, 153, 0.2);
}

:deep(.custom-input .van-field__control) {
  color: #fff !important;
  font-size: 15px;
  &::placeholder {
    color: rgba(255, 255, 255, 0.4) !important;
  }
}

:deep(.custom-input .van-cell__value) {
  overflow: visible;
}

.get-code-btn {
  font-size: 13px;
  color: #fbcfe8; /* pink-200 */
  padding: 6px 14px;
  background: rgba(236, 72, 153, 0.15);
  border-radius: 99px;
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(236, 72, 153, 0.3);
}

.get-code-btn:active {
  background: rgba(236, 72, 153, 0.25);
  transform: scale(0.95);
}

/* Gradient Button */
:deep(.submit-btn) {
  background: linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%) !important;
  border: none !important;
  height: 48px;
  border-radius: 24px !important;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
  transition: all 0.3s ease;
}

:deep(.submit-btn:active) {
  transform: scale(0.97);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

:deep(.submit-btn::before) {
  display: none;
}
</style>
