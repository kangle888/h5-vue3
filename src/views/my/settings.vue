<script setup lang="ts">
import { useRouter } from "vue-router";
import { showConfirmDialog, showSuccessToast } from "vant";
import { logoutApi } from "@/api/c-auth";
import { getCurrentCUserApi } from "@/api/c-user";
import { computed, ref } from "vue";

defineOptions({ name: "MySettings" });

const router = useRouter();
const mobile = ref("");
const agreementVisible = ref(false);
const agreementType = ref<"user" | "privacy">("user");
const aboutVisible = ref(false);

const agreementTitle = computed(() =>
  agreementType.value === "user" ? "《遇见App用户协议》" : "《遇见App隐私政策》"
);

const userAgreementContent = `欢迎使用遇见App（以下简称“本平台”）。本协议是您与本平台之间就使用服务所订立的协议。

1. 服务说明
1.1 本平台提供交友互动、聊天沟通、内容浏览等服务。
1.2 您在使用过程中应遵守法律法规与平台规则，不得发布违法违规内容。

2. 账号与安全
2.1 您应保证注册信息真实、合法、有效。
2.2 请妥善保管账号与密码，因您自身原因造成的风险由您承担。

3. 用户行为规范
3.1 不得发布涉黄涉赌、暴力恐怖、诈骗引流等违法内容。
3.2 不得侮辱、诽谤、骚扰他人，不得侵犯他人合法权益。
3.3 不得利用平台从事任何违法活动。

4. 内容与知识产权
4.1 您发布的内容应具备合法来源，且不侵犯第三方权利。
4.2 本平台享有依法维护平台内容秩序与安全的权利。

5. 责任限制
5.1 平台将尽力保障服务连续性，但不对不可抗力导致的中断承担责任。
5.2 因您违规使用造成损失的，平台有权采取限制、封禁等措施。

6. 协议更新
6.1 平台可根据业务发展更新本协议。
6.2 继续使用服务即视为您接受更新后的协议。

如您对本协议有疑问，可通过“关于我们”中的联系方式与我们联系。`;

const privacyPolicyContent = `遇见App非常重视您的个人信息与隐私保护。本政策将说明我们如何收集、使用、存储和保护您的信息。

1. 我们收集的信息
1.1 您注册/登录时提供的信息：手机号、登录凭证等。
1.2 您使用服务时产生的信息：聊天记录、设备标识、登录日志等。
1.3 为保障服务安全，我们可能收集必要的风控信息。

2. 信息使用目的
2.1 提供账号登录、聊天互动等核心功能。
2.2 进行身份验证、安全风控、异常排查。
2.3 改善产品体验与服务质量。

3. 信息共享与披露
3.1 未经您同意，我们不会向无关第三方出售您的个人信息。
3.2 在法律法规要求或监管机关依法要求下，我们可能依法披露。

4. 信息存储与保护
4.1 我们采取合理可行的安全措施保护您的信息。
4.2 我们仅在实现服务目的所需期限内保留您的个人信息。

5. 您的权利
5.1 您有权查询、更正、删除个人信息。
5.2 您可通过注销账号等方式终止服务。

6. 未成年人保护
6.1 若您为未成年人，请在监护人指导下使用本平台服务。

7. 政策更新
7.1 我们可能适时更新本政策，更新后将通过适当方式提示。

如您对隐私政策有疑问，可通过“关于我们”中的联系方式与我们联系。`;

const openAgreement = (type: "user" | "privacy") => {
  agreementType.value = type;
  agreementVisible.value = true;
};

const aboutContent = `遇见 App 是一款以真实、温暖、陪伴为核心理念的社交应用。

我们希望帮助每一位用户，在忙碌生活中更高效地遇见志同道合的人，建立真诚、平等、舒适的连接。

【我们的愿景】
让每一次相遇都更真实，让每一次聊天都更有价值。

【我们在做什么】
1. 提供安全、稳定、流畅的聊天与互动体验；
2. 通过风控与内容治理，持续维护友善社区氛围；
3. 持续优化产品细节，提升匹配效率与沟通质量。

【我们的价值观】
真实：反对虚假人设与欺骗行为；
尊重：倡导边界感与彼此尊重；
安全：保护用户信息与交流环境；
长期：坚持做对用户长期有价值的产品。

【联系我们】
客服邮箱：support@yujianapp.com
工作时间：周一至周日 09:00-21:00

感谢你使用遇见 App，祝你在这里遇见更好的关系与体验。`;

const agreementContent = computed(() =>
  agreementType.value === "user" ? userAgreementContent : privacyPolicyContent
);

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
          <div class="cell clickable" @click="aboutVisible = true">
            <span class="label">关于我们</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="cell clickable" @click="openAgreement('user')">
            <span class="label">用户协议</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <div class="cell clickable" @click="openAgreement('privacy')">
            <span class="label">隐私政策</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div>
          <!-- <div class="cell clickable">
            <span class="label">已收集个人信息清单</span>
            <van-icon name="arrow" class="arrow-icon" />
          </div> -->
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

    <van-popup
      v-model:show="aboutVisible"
      position="bottom"
      round
      :style="{ height: '72vh', background: '#0b0b0b' }"
    >
      <div class="agreement-sheet">
        <div class="agreement-header">
          <span class="agreement-title">关于遇见 App</span>
          <van-icon name="cross" size="20" class="close-icon" @click="aboutVisible = false" />
        </div>
        <div class="agreement-sub">让每一次相遇都更真实</div>
        <div class="agreement-body">
          <pre>{{ aboutContent }}</pre>
        </div>
      </div>
    </van-popup>

    <van-popup
      v-model:show="agreementVisible"
      position="bottom"
      round
      :style="{ height: '78vh', background: '#0b0b0b' }"
    >
      <div class="agreement-sheet">
        <div class="agreement-header">
          <span class="agreement-title">{{ agreementTitle }}</span>
          <van-icon name="cross" size="20" class="close-icon" @click="agreementVisible = false" />
        </div>
        <div class="agreement-sub">更新日期：2026-03-27</div>
        <div class="agreement-body">
          <pre>{{ agreementContent }}</pre>
        </div>
      </div>
    </van-popup>
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

.agreement-sheet {
  height: 100%;
  display: flex;
  flex-direction: column;
  color: #f3f4f6;
}

.agreement-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #1d1f24;
}

.agreement-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.close-icon {
  color: #9ca3af;
}

.agreement-sub {
  font-size: 12px;
  color: #9ca3af;
  padding: 10px 16px 6px;
}

.agreement-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 20px;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.65;
    font-size: 13px;
    color: #d1d5db;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
      "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
  }
}

@supports (padding: env(safe-area-inset-bottom)) {
  .content-container {
    padding-bottom: calc(50px + env(safe-area-inset-bottom));
  }

  .agreement-body {
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
  }
}
</style>
