<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  showFailToast,
  showLoadingToast,
  showSuccessToast,
  closeToast
} from "vant";
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

const showUserAgreement = ref(false);
const showPrivacyPolicy = ref(false);

const openUserAgreement = () => {
  showUserAgreement.value = true;
};

const openPrivacyPolicy = () => {
  showPrivacyPolicy.value = true;
};

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
  const password = form.password.trim();
  if (!/^1\d{10}$/.test(form.mobile)) {
    showFailToast("请输入正确手机号");
    return;
  }
  if (password.length < 6) {
    showFailToast("密码至少6位");
    return;
  }

  loading.value = true;
  showLoadingToast({ message: "登录中...", forbidClick: true, duration: 0 });
  try {
    const res = await loginPasswordApi({
      mobile: form.mobile,
      password,
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
    closeToast();
  }
};

const submitVerify = async () => {
  const code = form.code.trim();
  const password = form.password.trim();
  if (!/^1\d{10}$/.test(form.mobile)) {
    showFailToast("请输入正确手机号");
    return;
  }
  if (!code) {
    showFailToast("请输入验证码");
    return;
  }

  loading.value = true;
  showLoadingToast({ message: "登录中...", forbidClick: true, duration: 0 });
  try {
    const res = await codeLoginApi({
      mobile: form.mobile,
      code,
      password,
      deviceId: getDeviceId()
    });
    saveLogin(res, form.mobile);
    showSuccessToast("验证成功，已登录");
    router.replace({ name: "Home" });
  } catch {
    showFailToast("验证失败，请检查验证码");
  } finally {
    loading.value = false;
    closeToast();
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
              :class="{
                'opacity-50 pointer-events-none':
                  codeLoading || codeCountDown > 0
              }"
              @click="sendCode"
            >
              {{
                codeLoading
                  ? "获取中..."
                  : codeCountDown > 0
                    ? `${codeCountDown}s后重试`
                    : "获取验证码"
              }}
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
    <div
      class="mt-auto pt-10 text-center text-[12px] text-gray-600 agreement-footer"
    >
      登录即代表同意
      <span class="agreement-link" @click="openUserAgreement"
        >《用户协议》</span
      >
      和
      <span class="agreement-link" @click="openPrivacyPolicy"
        >《隐私政策》</span
      >
    </div>

    <van-popup
      v-model:show="showUserAgreement"
      position="bottom"
      round
      closeable
      class="protocol-popup"
      :style="{ height: '80%' }"
    >
      <div class="protocol-container">
        <h3>遇见App用户协议</h3>
        <p class="protocol-meta">更新日期：2026-03-27</p>
        <p>
          欢迎使用遇见App（以下简称“本平台”）。本协议是您与本平台之间关于账号注册、登录、使用服务及相关权利义务的约定。
          请您在使用前认真阅读并充分理解本协议全部内容。
        </p>
        <h4>一、服务说明</h4>
        <p>
          本平台为用户提供在线社交、兴趣匹配、内容浏览与互动等服务。平台有权根据业务发展对服务内容进行调整、升级、维护或暂停。
        </p>
        <h4>二、账号注册与使用</h4>
        <p>
          您应当使用真实、合法、有效的手机号完成注册和登录，并妥善保管账号、密码及验证码。因您保管不善导致的损失由您自行承担。
        </p>
        <h4>三、用户行为规范</h4>
        <p>
          您承诺在使用本平台时遵守法律法规及平台规则，不发布违法、违规、侵权、骚扰、诈骗、色情暴力等不当内容，不实施任何破坏平台秩序的行为。
        </p>
        <h4>四、内容与知识产权</h4>
        <p>
          您在平台发布的内容应确保合法且不侵犯第三方权益。平台依法享有对违规内容进行删除、屏蔽、限制展示、封禁账号等管理权。
        </p>
        <h4>五、责任限制</h4>
        <p>
          平台将尽力保障服务稳定和信息安全，但因不可抗力、网络故障、第三方原因等导致的服务中断或损失，平台在法律允许范围内承担相应责任。
        </p>
        <h4>六、协议变更与终止</h4>
        <p>
          平台有权根据法律法规及业务需要对本协议进行修订，修订内容公布后生效。若您继续使用服务，即视为接受修订后的协议。
        </p>
      </div>
    </van-popup>

    <van-popup
      v-model:show="showPrivacyPolicy"
      position="bottom"
      round
      closeable
      class="protocol-popup"
      :style="{ height: '80%' }"
    >
      <div class="protocol-container">
        <h3>遇见App隐私政策</h3>
        <p class="protocol-meta">更新日期：2026-03-27</p>
        <p>
          我们非常重视您的个人信息和隐私保护。本政策旨在说明我们如何收集、使用、存储和保护您的个人信息。
        </p>
        <h4>一、我们收集的信息</h4>
        <p>
          为实现登录与安全验证，我们会收集您的手机号、设备标识、登录日志等必要信息。您在使用服务过程中主动提供的资料（如头像、昵称、互动内容）也将用于功能实现。
        </p>
        <h4>二、信息使用目的</h4>
        <p>
          我们将信息用于账号登录认证、风险识别、消息通知、服务优化、故障排查及法律法规要求的合规用途，不会超出必要范围使用。
        </p>
        <h4>三、信息共享与披露</h4>
        <p>
          未经您同意，我们不会向无关第三方共享您的个人信息。法律法规另有规定、或为履行法定义务、保护用户及公众安全所必须时除外。
        </p>
        <h4>四、信息存储与保护</h4>
        <p>
          我们采取合理的技术与管理措施保护您的信息安全，包括访问控制、传输加密、权限隔离等。请您理解，互联网环境并非绝对安全。
        </p>
        <h4>五、未成年人保护</h4>
        <p>
          若您为未成年人，请在监护人指导下使用本平台。我们不会在明知情况下主动收集未成年人超出必要范围的个人信息。
        </p>
      </div>
    </van-popup>
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

.agreement-footer {
  line-height: 1.7;
}

.agreement-link {
  color: #dfc293;
  margin: 0 2px;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

:deep(.protocol-popup) {
  background: #0b0b0b;
}

.protocol-container {
  height: 100%;
  overflow-y: auto;
  padding: 22px 16px 28px;
  color: #d4d4d4;
  line-height: 1.75;

  h3 {
    margin: 8px 0 6px;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    text-align: center;
  }

  .protocol-meta {
    text-align: center;
    color: #8f8f8f;
    font-size: 12px;
    margin-bottom: 14px;
  }

  h4 {
    margin: 14px 0 6px;
    color: #f2f2f2;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 0 0 10px;
    font-size: 13px;
    color: #c8c8c8;
  }
}
</style>
