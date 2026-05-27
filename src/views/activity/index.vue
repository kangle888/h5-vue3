<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
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

const route = useRoute();

const deviceId = ref("");
const inviteCode = ref("");
const points = ref(0);
const drawChances = ref(0);
const inviteCount = ref(0);
const inviterCode = ref<string | null>(null);
const loading = ref(false);
const spinning = ref(false);
const ruleVisible = ref(false);
const inviteVisible = ref(false);
const historyVisible = ref(false);
const inviteInput = ref("");
const resultVisible = ref(false);
const resultPrize = ref("");
const drawStage = ref<"idle" | "running" | "finished">("idle");

// 抽奖历史记录
const drawHistory = ref<{ time: string; prize: string }[]>([]);

// 转盘相关
const wheelCanvas = ref<HTMLCanvasElement | null>(null);
const wheelAngle = ref(0);
const targetAngle = ref(0);
const animationId = ref(0);
const confettiCanvas = ref<HTMLCanvasElement | null>(null);

const prizes = [
  { name: "100元", color: "#FF6B35", textColor: "#fff", shadow: "#d44a1a" },
  { name: "谢谢\n参与", color: "#1a1a2e", textColor: "#aaa", shadow: "#111" },
  { name: "200元", color: "#FFD700", textColor: "#7a4a00", shadow: "#b89a00" },
  { name: "谢谢\n参与", color: "#16213e", textColor: "#aaa", shadow: "#0d1527" },
  { name: "500元", color: "#FF4757", textColor: "#fff", shadow: "#c0392b" },
  { name: "谢谢\n参与", color: "#0f3460", textColor: "#aaa", shadow: "#09223d" },
  { name: "1000元", color: "#C0392B", textColor: "#fff", shadow: "#922b21" },
  { name: "谢谢\n参与", color: "#1a1a2e", textColor: "#aaa", shadow: "#111" }
];

const SEGMENT_COUNT = prizes.length;
const SEGMENT_ANGLE = (2 * Math.PI) / SEGMENT_COUNT;

// 分享链接 - 指向 home 页进行引导
const shareLink = computed(() => {
  return `${window.location.origin}${window.location.pathname}#/activity/home?invite_code=${inviteCode.value}`;
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
  inviterCode.value = res.inviter_code || null;
  points.value = res.points;
  drawChances.value = res.draw_chances;
  inviteCount.value = res.invite_count;
  localStorage.setItem("activity_invite_code", res.invite_code);
};

const loadHistory = () => {
  try {
    const hist = JSON.parse(localStorage.getItem("activity_draw_history") || "[]");
    drawHistory.value = hist;
  } catch (e) {
    drawHistory.value = [];
  }
};

const saveHistory = (prize: string) => {
  const now = new Date();
  const timeStr = `${now.getMonth() + 1}-${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const newRecord = { time: timeStr, prize };
  const hist = [newRecord, ...drawHistory.value].slice(0, 10);
  drawHistory.value = hist;
  localStorage.setItem("activity_draw_history", JSON.stringify(hist));
};

const initActivity = async (inviteCodeParam?: string) => {
  const id = ensureDeviceId();
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

// ===================== 转盘绘制 =====================
const drawWheel = (angle: number) => {
  const canvas = wheelCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = cx - 6;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 外圈光晕
  const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r + 4);
  outerGlow.addColorStop(0, "rgba(255,215,0,0.0)");
  outerGlow.addColorStop(1, "rgba(255,215,0,0.35)");
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
  ctx.fillStyle = outerGlow;
  ctx.fill();

  // 绘制各扇形
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const startAngle = angle + i * SEGMENT_ANGLE;
    const endAngle = startAngle + SEGMENT_ANGLE;
    const prize = prizes[i];

    // 扇形
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, lightenColor(prize.color, 30));
    grad.addColorStop(1, prize.color);
    ctx.fillStyle = grad;
    ctx.fill();

    // 边框
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 文字
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + SEGMENT_ANGLE / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lines = prize.name.split("\n");
    const fontSize = lines[0].length <= 3 ? 15 : 13;
    ctx.font = `bold ${fontSize}px 'PingFang SC', 'Helvetica Neue', sans-serif`;
    ctx.fillStyle = prize.textColor;
    ctx.shadowColor = prize.shadow;
    ctx.shadowBlur = 4;

    const lineH = fontSize + 3;
    const totalH = lines.length * lineH;
    lines.forEach((line, li) => {
      ctx.fillText(line, r * 0.58, -totalH / 2 + li * lineH + lineH / 2);
    });
    ctx.restore();
  }

  // 外圈装饰环 - 金色
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  const ringGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  ringGrad.addColorStop(0, "#FFD700");
  ringGrad.addColorStop(0.5, "#FFF0A0");
  ringGrad.addColorStop(1, "#B8860B");
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 5;
  ctx.stroke();

  // 圆心装饰
  drawCenter(ctx, cx, cy);
};

const drawCenter = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
  // 外圈白圆
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  // 金色边
  const centerGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 24);
  centerGrad.addColorStop(0, "#FFF5C0");
  centerGrad.addColorStop(0.5, "#FFD700");
  centerGrad.addColorStop(1, "#B8860B");
  ctx.beginPath();
  ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
  ctx.fillStyle = centerGrad;
  ctx.fill();

  // 中心文字
  ctx.font = "bold 11px 'PingFang SC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#5a3200";
  ctx.fillText("点击", cx, cy - 6);
  ctx.fillText("抽奖", cx, cy + 8);
};

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

// 转盘旋转动画
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

const spinWheel = (prizeIndex: number, onDone: () => void) => {
  const startAngle = wheelAngle.value;
  // 保证转至少5圈 + 落在目标格
  const extra = Math.PI * 2 * (5 + Math.random() * 3);
  // 使指针(顶部, -π/2)停在该格中央
  const segCenter = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const landAngle = -Math.PI / 2 - segCenter + Math.PI * 2;
  const total = extra + ((landAngle - (startAngle % (Math.PI * 2)) + Math.PI * 4) % (Math.PI * 2));

  const duration = 4500;
  let start: number | null = null;

  const step = (ts: number) => {
    if (!start) start = ts;
    const elapsed = ts - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOut(progress);
    wheelAngle.value = startAngle + total * eased;
    drawWheel(wheelAngle.value);

    if (progress < 1) {
      animationId.value = requestAnimationFrame(step);
    } else {
      wheelAngle.value = startAngle + total;
      drawWheel(wheelAngle.value);
      onDone();
    }
  };
  animationId.value = requestAnimationFrame(step);
};

// ===================== 烟花/彩纸动画 =====================
interface Confetti {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; rotation: number; rotV: number; alpha: number;
}
const confettiParticles = ref<Confetti[]>([]);
let confettiAnim = 0;

const launchConfetti = (isBigWin = false) => {
  const canvas = confettiCanvas.value;
  if (!canvas) return;
  const colors = ["#FFD700","#FF4757","#FF6B35","#FFF","#C0392B","#FFB700","#00D2FF"];
  const particles: Confetti[] = [];
  const count = isBigWin ? 250 : 120;
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width * (0.2 + Math.random() * 0.6),
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * (isBigWin ? 18 : 12),
      vy: -Math.random() * (isBigWin ? 20 : 14) - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 5 + Math.random() * 7,
      rotation: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
      alpha: 1
    });
  }
  confettiParticles.value = particles;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.vx *= 0.99;
      p.rotation += p.rotV;
      p.alpha -= 0.012;
      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
    });
    if (alive) confettiAnim = requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  confettiAnim = requestAnimationFrame(animate);
};

// ===================== 抽奖逻辑 =====================
const getPrizeIndex = (prizeName: string): number => {
  const map: Record<string, number> = {
    "100元": 0,
    "200元": 2,
    "500元": 4,
    "1000元": 6
  };
  return map[prizeName] ?? 1; // 默认给谢谢参与格子
};

const onDraw = async () => {
  if (loading.value || spinning.value) return;
  if (drawChances.value <= 0) {
    showFailToast("抽奖次数不足，邀请好友可获得更多次数");
    return;
  }
  loading.value = true;
  spinning.value = true;
  drawStage.value = "running";
  
  // 假装网络慢一点，避免toast太快消失
  showLoadingToast({ message: "抽奖中...", forbidClick: true, duration: 0 });

  try {
    const res = await activityDrawApi({ device_id: deviceId.value });
    closeToast();
    resultPrize.value = res.prize;
    points.value = res.points;
    drawChances.value = res.draw_chances;
    
    saveHistory(res.prize);

    const idx = getPrizeIndex(res.prize);
    spinWheel(idx, () => {
      drawStage.value = "finished";
      spinning.value = false;
      loading.value = false;
      resultVisible.value = true;
      
      // 大奖放更多烟花
      if (res.prize === "1000元" || res.prize === "500元") {
        launchConfetti(true);
      } else {
        launchConfetti(false);
      }
    });
  } catch {
    drawStage.value = "idle";
    spinning.value = false;
    loading.value = false;
    closeToast();
    showFailToast("抽奖失败，请稍后重试");
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

const handleWheelClick = () => {
  if (!spinning.value) onDraw();
};

onMounted(async () => {
  // 解析 invite_code（多重降级策略保证不丢失）
  let finalInviteCode = route.query.invite_code as string;
  
  if (!finalInviteCode) {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    finalInviteCode = params.get("invite_code") || "";
  }
  
  if (!finalInviteCode) {
    finalInviteCode = sessionStorage.getItem("activity_from_invite_code") || "";
  }

  await initActivity(finalInviteCode);
  loadHistory();

  // 初始化画布尺寸
  await new Promise(r => setTimeout(r, 100));
  if (wheelCanvas.value) {
    const size = Math.min(window.innerWidth - 48, 340);
    wheelCanvas.value.width = size;
    wheelCanvas.value.height = size;
    drawWheel(wheelAngle.value);
  }
  if (confettiCanvas.value) {
    confettiCanvas.value.width = window.innerWidth;
    confettiCanvas.value.height = window.innerHeight;
  }
});

onBeforeUnmount(() => {
  closeToast();
  if (animationId.value) cancelAnimationFrame(animationId.value);
  if (confettiAnim) cancelAnimationFrame(confettiAnim);
});
</script>

<template>
  <div class="activity-page">
    <!-- 背景粒子/光效 -->
    <div class="bg-radial bg-r1"></div>
    <div class="bg-radial bg-r2"></div>
    <div class="bg-radial bg-r3"></div>

    <!-- 烟花画布（全屏） -->
    <canvas ref="confettiCanvas" class="confetti-canvas" />

    <!-- 顶部标题区 -->
    <header class="page-header">
      <div class="header-glow"></div>
      <div class="header-top">
        <span class="live-badge">
          <i class="live-dot"></i>活动进行中
        </span>
        <div class="top-chips">
          <span v-if="inviterCode" class="invited-by-chip">由 {{ inviterCode }} 邀请</span>
          <span v-if="inviteCode" class="invite-chip" @click="onCopyInvite">我的邀请码：{{ inviteCode }}</span>
        </div>
      </div>
      <h1 class="page-title">幸运大转盘</h1>
      <p class="page-sub">转动命运，赢取丰厚奖励</p>
    </header>

    <!-- 转盘区域 -->
    <section class="wheel-section">
      <div class="wheel-wrap">
        <!-- 外圈装饰光晕 -->
        <div class="wheel-halo"></div>
        <div class="wheel-halo wheel-halo-2"></div>

        <!-- 转盘容器 -->
        <div class="wheel-container" @click="handleWheelClick">
          <!-- 指针 -->
          <div class="pointer-wrap">
            <svg class="pointer-svg" viewBox="0 0 28 42" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#FF4040"/>
                  <stop offset="100%" stop-color="#8B0000"/>
                </linearGradient>
              </defs>
              <polygon points="14,42 0,4 28,4" fill="url(#pg)" stroke="white" stroke-width="1.5"/>
              <circle cx="14" cy="4" r="7" fill="#FF4040" stroke="white" stroke-width="2"/>
            </svg>
          </div>

          <canvas
            ref="wheelCanvas"
            class="wheel-canvas"
            :class="{ spinning }"
          />
        </div>

        <!-- 抽奖按钮（悬浮） -->
        <button
          class="draw-fab"
          :class="{ loading: spinning }"
          :disabled="spinning || loading"
          @click="onDraw"
        >
          <span class="fab-inner">
            <span class="fab-text">{{ spinning ? "祈愿中..." : "立即抽奖" }}</span>
            <span v-if="!spinning" class="fab-count">剩余 {{ drawChances }} 次</span>
          </span>
          <span class="fab-glow"></span>
        </button>
      </div>
    </section>

    <!-- 奖品列表 -->
    <section class="prizes-section">
      <h2 class="section-title">
        <span class="title-line"></span>
        丰厚奖品
        <span class="title-line"></span>
      </h2>
      <div class="prize-grid">
        <div v-for="p in [prizes[0], prizes[2], prizes[4], prizes[6]]" :key="p.name" class="prize-card">
          <div class="prize-icon" :style="{ background: p.color }">
            <span>¥</span>
          </div>
          <div class="prize-name">{{ p.name }}</div>
        </div>
      </div>
    </section>

    <!-- 我的信息 -->
    <section class="info-section">
      <div class="info-card">
        <div class="info-item">
          <div class="info-icon points-icon">🏆</div>
          <div>
            <div class="info-label">我的积分</div>
            <div class="info-value">{{ points }}</div>
          </div>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <div class="info-icon chance-icon">🎰</div>
          <div>
            <div class="info-label">抽奖次数</div>
            <div class="info-value highlight">{{ drawChances }}</div>
          </div>
        </div>
        <div class="info-divider"></div>
        <div class="info-item">
          <div class="info-icon invite-icon">👥</div>
          <div>
            <div class="info-label">邀请人数</div>
            <div class="info-value">{{ inviteCount }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 操作按钮 -->
    <section class="actions-section">
      <button class="action-btn primary-action" @click="onCopyInvite">
        <span class="action-icon">🔗</span>
        邀请好友 赢抽奖次数
      </button>
      <div class="action-row-2">
        <button class="action-btn ghost-action" @click="openInviteModal">
          <span class="action-icon">🎁</span>
          填写邀请码
        </button>
        <button class="action-btn ghost-action" @click="historyVisible = true">
          <span class="action-icon">📜</span>
          抽奖记录
        </button>
        <button class="action-btn ghost-action" @click="ruleVisible = true">
          <span class="action-icon">📋</span>
          活动规则
        </button>
      </div>
    </section>

    <!-- 中奖结果弹窗 -->
    <van-popup v-model:show="resultVisible" round closeable position="center" :style="{ background: 'transparent' }">
      <div class="result-popup">
        <div class="result-rays">
          <div v-for="i in 12" :key="i" class="ray" :style="{ transform: `rotate(${i * 30}deg)` }"></div>
        </div>
        <div class="result-icon">🎉</div>
        <div class="result-badge-text">恭喜获得！</div>
        <div class="result-prize">{{ resultPrize }}</div>
        <p class="result-tip">奖励将在活动结束后统一发放</p>
        <button class="result-btn" @click="resultVisible = false">好的，继续抽！</button>
      </div>
    </van-popup>

    <!-- 活动规则弹窗 -->
    <van-popup v-model:show="ruleVisible" position="bottom" round>
      <div class="popup-panel">
        <div class="popup-handle"></div>
        <h3 class="popup-title">📋 活动规则</h3>
        <ul class="rule-list">
          <li>🎟️ 用户首次进入活动页，赠送 <strong>1 次</strong>抽奖机会</li>
          <li>🔗 分享邀请链接，新用户首次进入后，邀请人 <strong>+1 积分</strong></li>
          <li>💎 <strong>10 积分</strong>可兑换 1 次抽奖机会</li>
          <li>🏆 奖品为 100元 / 200元 / 500元 / 1000元</li>
          <li>⚠️ 同设备仅可被邀请一次，避免重复领取</li>
        </ul>
      </div>
    </van-popup>

    <!-- 抽奖历史弹窗 -->
    <van-popup v-model:show="historyVisible" position="bottom" round>
      <div class="popup-panel history-panel">
        <div class="popup-handle"></div>
        <h3 class="popup-title">📜 抽奖记录</h3>
        <div v-if="drawHistory.length > 0" class="history-list">
          <div v-for="(item, idx) in drawHistory" :key="idx" class="history-item">
            <span class="history-time">{{ item.time }}</span>
            <span class="history-prize">{{ item.prize }}</span>
          </div>
        </div>
        <div v-else class="history-empty">
          暂无抽奖记录，快去抽奖吧~
        </div>
      </div>
    </van-popup>

    <!-- 填写邀请码弹窗 -->
    <van-popup v-model:show="inviteVisible" position="bottom" round>
      <div class="popup-panel">
        <div class="popup-handle"></div>
        <h3 class="popup-title">🎁 填写邀请人邀请码</h3>
        <van-field
          v-model="inviteInput"
          placeholder="请输入邀请人邀请码"
          class="invite-field"
        />
        <button class="action-btn primary-action full-w" @click="onInviteClaim">
          领取邀请奖励
        </button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped lang="less">
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');

// ---- 主页面 ----
.activity-page {
  min-height: 100vh;
  padding-bottom: 40px;
  position: relative;
  overflow-x: hidden;
  background: linear-gradient(160deg, #0d0d1a 0%, #1a0a2e 40%, #2d0b0b 100%);
  font-family: 'Outfit', 'PingFang SC', 'Helvetica Neue', sans-serif;
  color: #fff;
}

// ---- 背景光效 ----
.bg-radial {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
.bg-r1 {
  width: 400px; height: 400px;
  left: -150px; top: -100px;
  background: radial-gradient(circle, rgba(255,100,50,0.18) 0%, transparent 70%);
}
.bg-r2 {
  width: 300px; height: 300px;
  right: -100px; top: 200px;
  background: radial-gradient(circle, rgba(180,0,200,0.12) 0%, transparent 70%);
}
.bg-r3 {
  width: 350px; height: 350px;
  left: 50%; top: 60%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(255,215,0,0.08) 0%, transparent 70%);
}

// ---- 烟花画布 ----
.confetti-canvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}

// ---- 顶部 ----
.page-header {
  position: relative;
  z-index: 1;
  padding: 20px 20px 8px;
  text-align: center;
  overflow: hidden;
}
.header-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(ellipse at 50% 0%, rgba(255,180,0,0.15) 0%, transparent 70%);
  pointer-events: none;
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255,70,70,0.18);
  border: 1px solid rgba(255,70,70,0.35);
  color: #ff7070;
  font-size: 12px;
  font-weight: 600;
}
.live-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #ff4040;
  box-shadow: 0 0 6px #ff4040;
  animation: blink 1.2s ease-in-out infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.top-chips {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.invite-chip {
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255,215,0,0.12);
  border: 1px solid rgba(255,215,0,0.3);
  color: #FFD700;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.invited-by-chip {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  font-size: 10px;
}

.page-title {
  font-size: 28px;
  font-weight: 900;
  margin: 0 0 4px;
  background: linear-gradient(135deg, #FFD700 0%, #FF9A3C 50%, #FF4040 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
  text-shadow: none;
}
.page-sub {
  margin: 0;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
}

// ---- 转盘区 ----
.wheel-section {
  position: relative;
  z-index: 1;
  padding: 16px 0 0;
  display: flex;
  justify-content: center;
}
.wheel-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.wheel-halo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,180,0,0.12) 0%, transparent 65%);
  pointer-events: none;
  animation: halopulse 2.5s ease-in-out infinite;
}
.wheel-halo-2 {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(255,80,0,0.07) 0%, transparent 65%);
  animation: halopulse 2.5s ease-in-out 1.25s infinite;
}
@keyframes halopulse {
  0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
}
.wheel-container {
  position: relative;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.pointer-wrap {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: 28px;
  filter: drop-shadow(0 4px 8px rgba(255,0,0,0.5));
}
.pointer-svg {
  width: 28px;
  height: 42px;
}
.wheel-canvas {
  display: block;
  border-radius: 50%;
  box-shadow:
    0 0 0 6px rgba(255,215,0,0.25),
    0 0 40px rgba(255,150,0,0.3),
    0 24px 60px rgba(0,0,0,0.6);
  transition: box-shadow 0.3s;
  &.spinning {
    box-shadow:
      0 0 0 6px rgba(255,215,0,0.5),
      0 0 60px rgba(255,150,0,0.6),
      0 24px 60px rgba(0,0,0,0.6);
  }
}

// ---- 抽奖按钮 ----
.draw-fab {
  position: relative;
  margin-top: 20px;
  border: none;
  border-radius: 999px;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  width: 220px;
  height: 54px;
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }
}
.fab-inner {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #FF6B35 0%, #FF4040 50%, #C0392B 100%);
  box-shadow: 0 8px 24px rgba(255,100,50,0.45), inset 0 1px 0 rgba(255,255,255,0.25);
}
.draw-fab.loading .fab-inner {
  background: linear-gradient(90deg, #888 0%, #666 100%);
}
.fab-text {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1px;
  line-height: 1;
}
.fab-count {
  font-size: 11px;
  color: rgba(255,255,255,0.8);
  margin-top: 2px;
  font-weight: 400;
}
.fab-glow {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  animation: shimmer 2s linear infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

// ---- 奖品展示 ----
.prizes-section {
  position: relative;
  z-index: 1;
  padding: 24px 20px 0;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255,255,255,0.8);
  margin: 0 0 14px;
  letter-spacing: 1px;
}
.title-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent);
}
.prize-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.prize-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 6px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
  transition: transform 0.2s, background 0.2s;
  &:active { transform: scale(0.95); }
}
.prize-icon {
  width: 40px; height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  color: #fff;
  box-shadow: 0 6px 16px rgba(0,0,0,0.3);
}
.prize-name {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255,255,255,0.85);
  text-align: center;
}

// ---- 信息卡片 ----
.info-section {
  position: relative;
  z-index: 1;
  padding: 16px 20px 0;
}
.info-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.info-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}
.info-icon {
  font-size: 22px;
  width: 36px;
  text-align: center;
}
.info-label {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  margin-bottom: 2px;
}
.info-value {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  &.highlight { color: #FFD700; }
}
.info-divider {
  width: 1px;
  height: 36px;
  background: rgba(255,255,255,0.1);
  margin: 0 4px;
}

// ---- 操作按钮 ----
.actions-section {
  position: relative;
  z-index: 1;
  padding: 16px 20px 0;
}
.action-btn {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.15s, box-shadow 0.15s;
  &:active { transform: scale(0.97); }
}
.primary-action {
  background: linear-gradient(90deg, #FF9A3C 0%, #FF6B35 50%, #FF4040 100%);
  color: #fff;
  box-shadow: 0 8px 24px rgba(255,100,50,0.35);
  margin-bottom: 10px;
}
.action-row-2 {
  display: flex;
  gap: 10px;
}
.ghost-action {
  flex: 1;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.8);
  font-size: 14px;
  padding: 12px;
  backdrop-filter: blur(8px);
}
.action-icon { font-size: 16px; }

// ---- 中奖弹窗 ----
.result-popup {
  position: relative;
  min-width: 280px;
  padding: 32px 24px 28px;
  text-align: center;
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(160deg, #1a0a2e 0%, #2d0b0b 100%);
  border: 1px solid rgba(255,215,0,0.3);
  box-shadow: 0 0 60px rgba(255,100,0,0.3);
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes popIn {
  0% { transform: scale(0.7); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.result-rays {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ray {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,215,0,0.12), transparent);
  transform-origin: left center;
}
.result-icon {
  font-size: 52px;
  margin-bottom: 8px;
  animation: bounceIn 0.5s 0.2s both;
}
@keyframes bounceIn {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
.result-badge-text {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  margin-bottom: 4px;
}
.result-prize {
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(135deg, #FFD700, #FF9A3C);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}
.result-tip {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  margin: 0 0 20px;
}
.result-btn {
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 13px;
  background: linear-gradient(90deg, #FFD700, #FF9A3C);
  color: #5a2800;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(255,180,0,0.35);
  &:active { transform: scale(0.97); }
}

// ---- 弹窗面板 ----
.popup-panel {
  padding: 16px 20px 32px;
  background: #1a1a2e;
  color: #fff;
  border-radius: 28px 28px 0 0;
}
.popup-handle {
  width: 36px; height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.2);
  margin: 0 auto 16px;
}
.popup-title {
  font-size: 18px;
  font-weight: 800;
  margin: 0 0 16px;
  color: #fff;
}
.rule-list {
  padding: 0;
  margin: 0;
  list-style: none;
  li {
    padding: 10px 14px;
    border-radius: 12px;
    background: rgba(255,255,255,0.05);
    margin-bottom: 8px;
    font-size: 14px;
    color: rgba(255,255,255,0.75);
    line-height: 1.6;
    strong { color: #FFD700; }
  }
}

// 历史记录
.history-panel {
  min-height: 300px;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  font-size: 14px;
}
.history-time {
  color: rgba(255,255,255,0.6);
}
.history-prize {
  color: #FFD700;
  font-weight: 700;
}
.history-empty {
  padding: 40px 0;
  text-align: center;
  color: rgba(255,255,255,0.4);
  font-size: 14px;
}

.invite-field {
  margin-bottom: 14px;
  border-radius: 14px !important;
}
.full-w {
  margin-top: 0;
}

:deep(.van-popup) {
  background: transparent !important;
}
:deep(.van-popup--bottom) {
  background: transparent !important;
}
:deep(.van-field) {
  background: rgba(255,255,255,0.08) !important;
  border-radius: 14px !important;
  color: #fff !important;
  margin-bottom: 14px;
}
:deep(.van-field__control) {
  color: #fff !important;
}
:deep(.van-field__placeholder) {
  color: rgba(255,255,255,0.35) !important;
}
:deep(.van-popup--center) {
  background: transparent !important;
}
</style>
