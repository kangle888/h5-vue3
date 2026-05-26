<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  showFailToast,
  showLoadingToast,
  showSuccessToast,
  closeToast
} from "vant";
import {
  activityDrawApi,
  activityInitApi,
  activityInfoApi,
  activityInviteClaimApi,
  type ActivityInitResult
} from "@/api/activity";

defineOptions({ name: "Activity" });

const deviceId = ref("");
const inviteCode = ref("");
const points = ref(0);
const drawChances = ref(0);
const inviteCount = ref(0);
const prizeResult = ref("");
const loading = ref(false);
const spinning = ref(false);
const ruleVisible = ref(false);
const inviteVisible = ref(false);
const inviteInput = ref("");
const resultVisible = ref(false);
const resultPrize = ref("");
const inviteFromLink = ref(false);
const drawStage = ref<"idle" | "running" | "finished">("idle");

const prizes = [
  { name: "100元", rate: 40, accent: "#ff7a45" },
  { name: "200元", rate: 35, accent: "#ffa940" },
  { name: "500元", rate: 20, accent: "#faad14" },
  { name: "1000元", rate: 5, accent: "#f5222d" }
];

const shareLink = computed(() => {
  return `${window.location.origin}${window.location.pathname}#/activity?invite_code=${inviteCode.value}`;
});

const ensureDeviceId = () => {
  let id = localStorage.getItem("activity_device_id");
  if (!id) {
    id =
      crypto.randomUUID?.() ||
      `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("activity_device_id", id);
  }
  deviceId.value = id;
  return id;
};

const saveState = (res: ActivityInitResult) => {
  inviteCode.value = res.invite_code;
  points.value = res.points;
  drawChances.value = res.draw_chances;
  inviteCount.value = res.invite_count;
  localStorage.setItem("activity_invite_code", res.invite_code);
};

const shareMessage = computed(() => `我正在参加活动抽奖，快来一起参与吧！邀请码：${inviteCode.value}`);

const initActivity = async (inviteCodeParam?: string) => {
  const id = ensureDeviceId();
  inviteFromLink.value = !!inviteCodeParam;
  const res = await activityInitApi({
    device_id: id,
    invite_code: inviteCodeParam || undefined
  });
  saveState(res);
};

const refreshInfo = async () => {
  if (!deviceId.value) return;
  const res = await activityInfoApi(deviceId.value);
  inviteCode.value = res.invite_code;
  points.value = res.points;
  drawChances.value = res.draw_chances;
  inviteCount.value = res.invite_count;
};

const onDraw = async () => {
  if (loading.value) return;
  if (drawChances.value <= 0) {
    showFailToast("抽奖次数不足，可先通过邀请好友或积分兑换");
    return;
  }
  loading.value = true;
  spinning.value = true;
  drawStage.value = "running";
  showLoadingToast({ message: "抽奖中...", forbidClick: true, duration: 0 });
  try {
    const res = await activityDrawApi({ device_id: deviceId.value });
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    prizeResult.value = `恭喜获得 ${res.prize}`;
    resultPrize.value = res.prize;
    points.value = res.points;
    drawChances.value = res.draw_chances;
    drawStage.value = "finished";
    resultVisible.value = true;
    showSuccessToast(prizeResult.value);
  } catch {
    drawStage.value = "idle";
    showFailToast("抽奖失败，请稍后重试");
  } finally {
    loading.value = false;
    spinning.value = false;
    closeToast();
    window.setTimeout(() => {
      if (drawStage.value === "finished") {
        drawStage.value = "idle";
      }
    }, 800);
  }
};

const onCopyInvite = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    showSuccessToast("邀请链接已复制");
  } catch {
    showFailToast("复制失败，请手动分享");
  }
};

const onShare = async () => {
  await onCopyInvite();
};

const onInviteClaim = async () => {
  if (!inviteInput.value.trim()) {
    showFailToast("请输入邀请人邀请码");
    return;
  }
  try {
    await activityInviteClaimApi({
      device_id: deviceId.value,
      inviter_code: inviteInput.value.trim()
    });
    showSuccessToast("邀请奖励已领取");
    inviteVisible.value = false;
    await refreshInfo();
  } catch {
    showFailToast("领取失败，请检查邀请码");
  }
};

const openInviteModal = () => {
  inviteInput.value = "";
  inviteVisible.value = true;
};

onMounted(async () => {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const inviteParam = params.get("invite_code") || undefined;
  await initActivity(inviteParam);
});

onBeforeUnmount(() => {
  closeToast();
});
</script>

<template>
  <div class="activity-page">
    <div class="bg-glow bg-glow-a"></div>
    <div class="bg-glow bg-glow-b"></div>

    <section class="draw-card">
      <div class="draw-header">
        <div>
          <span class="draw-title">幸运抽奖</span>
          <p class="draw-subtitle">{{ prizeResult || "点击按钮立即抽奖" }}</p>
        </div>
        <span class="chip">{{ inviteCode ? `邀请码 ${inviteCode}` : "活动进行中" }}</span>
      </div>

      <div class="draw-stage" :class="drawStage">
        <div class="draw-glow"></div>
        <div class="draw-center">
          <div class="draw-core" :class="{ beating: spinning }">
            <span>抽奖中心</span>
            <strong>{{ drawChances }}</strong>
          </div>
          <button class="draw-btn" :disabled="loading" @click="onDraw">
            {{ loading ? "抽奖中..." : "立即抽奖" }}
          </button>
          <p class="draw-desc">当前可抽 {{ drawChances }} 次</p>
        </div>
      </div>
      <div class="draw-hint">中奖结果会直接展示在下方</div>
    </section>

    <section class="panel info-panel">
      <div class="panel-head">
        <h2>我的信息</h2>
        <span>积分与抽奖次数</span>
      </div>
      <div class="info-row">
        <div class="info-item">
          <span>当前积分</span>
          <strong>{{ points }}</strong>
        </div>
        <div class="info-item">
          <span>剩余抽奖次数</span>
          <strong>{{ drawChances }}</strong>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-btn" @click="onShare">邀请好友</button>
        <button class="ghost-btn" @click="ruleVisible = true">活动规则</button>
      </div>
    </section>

    <section class="panel result-panel-inline">
      <div class="panel-head">
        <h2>中奖奖品</h2>
        <span>本次结果</span>
      </div>
      <div class="result-box">
        <div class="result-box__title">{{ resultPrize || "暂无中奖结果" }}</div>
      </div>
    </section>

    <!-- <section class="panel share-panel">
      <div class="panel-head">
        <h2>活动分享</h2>
        <span>复制链接分享好友</span>
      </div>
      <div class="share-actions">
        <div class="link-box">{{ shareLink }}</div>
        <button class="primary-btn share-btn" @click="onShare">复制</button>
      </div>
    </section> -->

    <van-popup v-model:show="resultVisible" round closeable position="center">
      <div class="result-panel" :class="{ celebrate: drawStage === 'finished' }">
        <div class="result-badge">恭喜中奖</div>
        <h3>{{ resultPrize }}</h3>
        <button class="primary-btn full-width" @click="resultVisible = false">知道了</button>
      </div>
    </van-popup>

    <van-popup v-model:show="ruleVisible" position="bottom" round>
      <div class="popup-panel">
        <h3>活动规则</h3>
        <ol>
          <li>用户首次进入活动页，赠送 1 次抽奖机会。</li>
          <li>分享邀请链接，新用户首次进入后，邀请人 +1 积分。</li>
          <li>10 积分可兑换 1 次抽奖机会。</li>
          <li>奖品为 100 元 / 200 元 / 500 元 / 1000 元，概率固定在后端。</li>
          <li>同设备仅可被邀请一次，避免重复领取。</li>
        </ol>
      </div>
    </van-popup>

    <van-popup v-model:show="inviteVisible" position="bottom" round>
      <div class="popup-panel">
        <h3>填写邀请人邀请码</h3>
        <van-field v-model="inviteInput" placeholder="请输入邀请人邀请码" />
        <button class="draw-btn full-width" @click="onInviteClaim">
          领取邀请奖励
        </button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped lang="less">
.activity-page {
  min-height: 100vh;
  padding: 16px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #fff7ef 0%, #fff 40%, #f5f7fb 100%);
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(10px);
  pointer-events: none;
}

.bg-glow-a {
  width: 220px;
  height: 220px;
  left: -80px;
  top: -40px;
  background: radial-gradient(circle, rgba(255, 164, 77, 0.35), transparent 70%);
}

.bg-glow-b {
  width: 180px;
  height: 180px;
  right: -70px;
  top: 140px;
  background: radial-gradient(circle, rgba(255, 122, 69, 0.22), transparent 70%);
}

.banner-swipe {
  margin-bottom: 12px;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.banner-card,
.panel,
.draw-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 40px rgba(20, 20, 20, 0.08);
  backdrop-filter: blur(12px);
}

.banner-card {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  min-height: 180px;
  color: #fff;
}

.banner-content {
  flex: 1;

  h1 {
    margin: 10px 0 8px;
    font-size: 22px;
    line-height: 1.35;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.7;
    opacity: 0.96;
  }
}

.banner-stats {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;

  span {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.18);
    font-size: 12px;
  }
}

.banner-btn {
  margin-top: 14px;
  border: 0;
  border-radius: 999px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.96);
  color: #ff7a45;
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 10px 18px rgba(255, 122, 69, 0.18);
}

.banner-visual {
  width: 92px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
}

.draw-card {
  position: relative;
  z-index: 1;
  margin-bottom: 12px;
  padding: 16px;
  text-align: center;
}

.draw-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.draw-title {
  display: block;
  font-size: 18px;
  font-weight: 900;
  color: #1f1f1f;
  letter-spacing: 0.3px;
}

.draw-subtitle {
  margin: 4px 0 0;
  color: #7a7a7a;
  font-size: 13px;
}

.chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 122, 69, 0.14), rgba(255, 179, 106, 0.18));
  color: #ff7a45;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.draw-stage {
  position: relative;
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 248, 241, 0.92), rgba(255, 255, 255, 0.98));
}

.draw-stage.running {
  animation: pulse-card 0.8s ease-in-out infinite;
}

.draw-stage.finished {
  box-shadow: 0 0 0 2px rgba(255, 122, 69, 0.2), 0 18px 42px rgba(255, 122, 69, 0.16);
}

.draw-glow {
  position: absolute;
  inset: 14px;
  border-radius: 24px;
  background: radial-gradient(circle at center, rgba(255, 170, 110, 0.18), transparent 65%);
}

.draw-center {
  position: absolute;
  inset: 20px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,248,242,0.98));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  box-shadow: 0 14px 32px rgba(20,20,20,0.08);
}

.draw-core {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle at top, #fff9f4, #ffe9d8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(255, 122, 69, 0.08);
  transition: transform 0.2s ease;

  &.beating {
    animation: beat 0.5s ease-in-out infinite;
  }

  span {
    color: #7a7a7a;
    font-size: 12px;
  }

  strong {
    color: #ff7a45;
    font-size: 30px;
    line-height: 1;
    margin-top: 6px;
  }
}

.draw-desc {
  margin: 0;
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}

.draw-hint {
  margin-top: 12px;
  color: #8b8b8b;
  font-size: 12px;
}

.result-box {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffaf6, #fff3ea);
  border: 1px solid rgba(255, 122, 69, 0.12);
}

.result-box__title {
  font-size: 22px;
  font-weight: 900;
  color: #ff7a45;
  text-align: center;
}

@keyframes beat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes pulse-card {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.01);
  }
}

.draw-btn,
.secondary-btn,
.primary-btn,
.ghost-btn {
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  font-weight: 700;
}

.draw-btn {
  color: #fff;
  background: linear-gradient(90deg, #ff9b47, #ff6b2c);
  box-shadow: 0 10px 20px rgba(255, 122, 69, 0.28);
}

.primary-btn {
  color: #fff;
  background: linear-gradient(90deg, #ff9b47, #ff6b2c);
}

.ghost-btn {
  color: #ff7a45;
  background: #fff4eb;
}

.secondary-btn {
  width: 100%;
  margin-top: 12px;
  color: #ff7a45;
  background: #fff4eb;
}

.full-width {
  width: 100%;
}

.panel {
  padding: 14px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;

  h2 {
    margin: 0;
    font-size: 16px;
    line-height: 1.2;
    color: #1f1f1f;
  }

  span {
    color: #999;
    font-size: 12px;
    line-height: 1.2;
    white-space: nowrap;
  }
}

.prize-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.prize-item {
  padding: 16px 12px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(255, 249, 244, 1));
  border: 1px solid rgba(255, 122, 69, 0.14);
  box-shadow: 0 8px 18px rgba(255, 122, 69, 0.08);
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    right: -18px;
    top: -18px;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--accent) 25%, transparent), transparent 70%);
  }
}

.prize-value {
  font-size: 22px;
  font-weight: 800;
  color: var(--accent);
  position: relative;
  z-index: 1;
}

.prize-rate {
  margin-top: 8px;
  font-size: 12px;
  color: #777;
  position: relative;
  z-index: 1;
}

.info-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.info-item {
  flex: 1;
  padding: 14px;
  border-radius: 16px;
  background: #fafafa;

  span {
    display: block;
    color: #888;
    font-size: 12px;
    margin-bottom: 6px;
  }

  strong {
    font-size: 20px;
    color: #1f1f1f;
  }
}

.full {
  flex: 1;
}

.code {
  word-break: break-all;
  font-size: 14px !important;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

.action-row button {
  flex: 1;
}

.link-box {
  padding: 14px;
  border-radius: 16px;
  background: #fafafa;
  color: #5c5c5c;
  font-size: 12px;
  line-height: 1.8;
  word-break: break-all;
}

.popup-panel {
  padding: 18px;

  h3 {
    margin: 0 0 12px;
    font-size: 18px;
  }

  ol {
    padding-left: 18px;
    color: #555;
    line-height: 1.8;
  }
}

.share-panel .share-actions {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.share-panel .link-box {
  flex: 1;
  margin-top: 0;
  min-height: 56px;
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 122, 69, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.share-btn {
  min-width: 86px;
  height: 56px;
  padding: 0 16px;
  border-radius: 16px;
  white-space: nowrap;
  box-shadow: 0 10px 20px rgba(255, 122, 69, 0.18);
}

.share-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #ff7a45;
}

@keyframes pop-in {
  0% {
    transform: scale(0.92);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.result-panel {
  padding: 24px 20px;
  text-align: center;
  min-width: 260px;

  &.celebrate {
    animation: pop-in 0.35s ease-out;
  }

  h3 {
    margin: 12px 0 8px;
    font-size: 22px;
    color: #1f1f1f;
  }

  p {
    margin: 0 0 16px;
    color: #666;
    font-size: 13px;
  }
}

.result-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffb36a, #ff7a45);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 10px 18px rgba(255, 122, 69, 0.18);
}

.invite-banner {
  padding: 14px 16px;
  margin-bottom: 14px;
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(255, 122, 69, 0.12), rgba(255, 179, 106, 0.18));
  border: 1px solid rgba(255, 122, 69, 0.12);
  color: #8a4b2c;

  strong {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
    color: #1f1f1f;
  }

  p {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
  }
}

:deep(.van-field) {
  border-radius: 14px;
  background: #f7f8fa;
  margin-bottom: 14px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
