<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  showFailToast,
  showLoadingToast,
  closeToast
} from "vant";
import {
  activityDrawApi,
  activityInitApi,
  activityRecordsApi,
  type DrawRecordItem
} from "@/api/activity";
import {
  PRIZE_LIST,
  INITIAL_DRAW_CHANCES,
  type PrizeConfig
} from "./config/prizes";

defineOptions({ name: "ActivityDraw" });

// ===================== 状态定义 =====================
const deviceId = ref("");
const drawChances = ref(INITIAL_DRAW_CHANCES);
const spinning = ref(false);
const loading = ref(false);

// 弹窗状态
const resultVisible = ref(false);
const winningPrize = ref<PrizeConfig | null>(null);
const winningRecordId = ref<number | null>(null);

const recordsVisible = ref(false);
const recordList = ref<DrawRecordItem[]>([]);
const recordDetailVisible = ref(false);
const currentDetailRecord = ref<DrawRecordItem | null>(null);

const ruleVisible = ref(false);

// ===================== Canvas 转盘相关 =====================
const wheelCanvas = ref<HTMLCanvasElement | null>(null);
const confettiCanvas = ref<HTMLCanvasElement | null>(null);
const wheelAngle = ref(0);
const animationId = ref(0);
let confettiAnim = 0;

const SEGMENT_COUNT = PRIZE_LIST.length; // 6 个扇区
const SEGMENT_ANGLE = (2 * Math.PI) / SEGMENT_COUNT; // 60 度

// 图片缓存对象
const loadedImages = ref<Map<number, HTMLImageElement>>(new Map());

// 设备唯一标识
const ensureDeviceId = () => {
  let id = localStorage.getItem("activity_device_id");
  if (!id) {
    id =
      crypto.randomUUID?.() ||
      `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("activity_device_id", id);
  }
  deviceId.value = id;
  return id;
};

// ===================== 预加载 6 款奖品图片 =====================
const preloadImages = async () => {
  const promises = PRIZE_LIST.map(prize => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = prize.image;
      img.onload = () => {
        loadedImages.value.set(prize.id, img);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to load image for prize ${prize.id}`);
        resolve();
      };
    });
  });
  await Promise.all(promises);
};

// ===================== 绘制 6 扇区超清带图转盘 =====================
const drawWheel = (angle: number) => {
  const canvas = wheelCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 使用至少 3x 像素采样，彻底消除手机视网膜屏幕上的模糊现象
  const dpr = Math.max(window.devicePixelRatio || 1, 3);
  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const cx = width / 2;
  const cy = height / 2;
  const radius = cx - 8;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);

  // 开启全域高质量多级抗锯齿插值平滑
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. 最外层金色立体光晕与外圈
  const outerGlow = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius + 8);
  outerGlow.addColorStop(0, "rgba(255, 195, 18, 0)");
  outerGlow.addColorStop(1, "rgba(255, 159, 26, 0.45)");
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, 2 * Math.PI);
  ctx.fillStyle = outerGlow;
  ctx.fill();

  // 2. 外部华丽金属装饰底环
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI);
  const ringGradient = ctx.createLinearGradient(0, 0, width, height);
  ringGradient.addColorStop(0, "#FEE180");
  ringGradient.addColorStop(0.3, "#F39C12");
  ringGradient.addColorStop(0.7, "#FEE180");
  ringGradient.addColorStop(1, "#D35400");
  ctx.strokeStyle = ringGradient;
  ctx.lineWidth = 8;
  ctx.stroke();

  // 3. 装饰发光灯珠 (12颗)
  const bulbCount = 12;
  for (let b = 0; b < bulbCount; b++) {
    const bulbAngle = (2 * Math.PI / bulbCount) * b;
    const bx = cx + (radius + 4) * Math.cos(bulbAngle);
    const by = cy + (radius + 4) * Math.sin(bulbAngle);
    ctx.beginPath();
    ctx.arc(bx, by, 3.2, 0, 2 * Math.PI);
    ctx.fillStyle = b % 2 === 0 ? "#FFF9D2" : "#FF7675";
    ctx.shadowColor = b % 2 === 0 ? "#FFD700" : "#FF4757";
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // 4. 绘制 6 个扇区
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const startAngle = angle + i * SEGMENT_ANGLE;
    const endAngle = startAngle + SEGMENT_ANGLE;
    const prize = PRIZE_LIST[i];

    // 扇形背景
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = prize.bgColor;
    ctx.fill();

    // 扇形金边分隔线
    ctx.strokeStyle = "rgba(224, 164, 88, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. 绘制扇区内的奖品图片与奖品名称
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + SEGMENT_ANGLE / 2);

    // 绘制奖品文字 (靠近外圈，横向沿圆弧切线水平排布，字体清晰锐利)
    ctx.save();
    const textDistance = radius * 0.81;
    ctx.translate(textDistance, 0);
    ctx.rotate(Math.PI / 2); // 旋转 90 度，让文字横着展示！
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 12.5px -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif";
    ctx.fillStyle = prize.textColor;
    ctx.fillText(prize.shortName, 0, 0);
    ctx.restore();

    // 绘制奖品图片 (在扇区中段，放大尺寸至 0.33 提升清晰度，正向排列)
    const img = loadedImages.value.get(prize.id);
    const imgDistance = radius * 0.46; // 图片中心离转盘圆心的距离
    const imgSize = radius * 0.33; // 图片直径扩大至约 53px，让细节更丰富高清

    if (img && img.complete) {
      ctx.save();
      ctx.translate(imgDistance, 0);
      ctx.rotate(Math.PI / 2); // 旋转 90 度，使图片朝向与横向文字一致且正向！

      // 图片白色底圆与阴影
      ctx.beginPath();
      ctx.arc(0, 0, imgSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 5;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 高清圆形裁剪
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, imgSize / 2 - 0.5, 0, Math.PI * 2);
      ctx.clip();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(
        img,
        -imgSize / 2,
        -imgSize / 2,
        imgSize,
        imgSize
      );
      ctx.restore();

      // 图片外层金色立体描边
      ctx.beginPath();
      ctx.arc(0, 0, imgSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(243, 156, 18, 0.75)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  // 6. 转盘中心圆盘与底座
  ctx.beginPath();
  ctx.arc(cx, cy, 33, 0, 2 * Math.PI);
  const centerBg = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 33);
  centerBg.addColorStop(0, "#FFFFFF");
  centerBg.addColorStop(0.6, "#FFF2E2");
  centerBg.addColorStop(1, "#FAD390");
  ctx.fillStyle = centerBg;
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(cx, cy, 33, 0, 2 * Math.PI);
  ctx.strokeStyle = "#F39C12";
  ctx.lineWidth = 3;
  ctx.stroke();

  // 中心文字
  ctx.font = "bold 12.5px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#D63031";
  ctx.fillText("LUCKY", cx, cy - 7);
  ctx.font = "bold 11.5px sans-serif";
  ctx.fillText("抽奖", cx, cy + 8);

  ctx.restore();
};

// 减速缓动曲线 (Ease Out Quart)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

// ===================== 转盘旋转动画 =====================
const spinWheelToPrize = (targetPrizeIndex: number, onDone: () => void) => {
  const startAngle = wheelAngle.value;

  // 目标扇区中心相对于转盘自身的角度
  const segCenter = targetPrizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;

  // 指针位于顶部 (12 点钟方向，即 -π/2 或 3π/2)
  const pointerAngle = -Math.PI / 2;
  const currentNormalized = (startAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  let targetAngleMod = (pointerAngle - segCenter) % (Math.PI * 2);
  if (targetAngleMod < 0) targetAngleMod += Math.PI * 2;

  // 计算需要顺时针额外旋转的弧度
  let diff = targetAngleMod - currentNormalized;
  if (diff < 0) diff += Math.PI * 2;

  // 保证至少旋转 6 圈 (12π)，让抽奖视觉效果更震撼
  const totalRotation = Math.PI * 2 * 6 + diff;

  const duration = 4600; // 4.6 秒减速旋转
  let startTime: number | null = null;

  const step = (timestamp: number) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOut(progress);

    wheelAngle.value = startAngle + totalRotation * eased;
    drawWheel(wheelAngle.value);

    if (progress < 1) {
      animationId.value = requestAnimationFrame(step);
    } else {
      wheelAngle.value = startAngle + totalRotation;
      drawWheel(wheelAngle.value);
      onDone();
    }
  };

  animationId.value = requestAnimationFrame(step);
};

// ===================== 烟花 / 彩纸动画 =====================
interface Confetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotV: number;
  alpha: number;
}

const launchConfetti = () => {
  const canvas = confettiCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const colors = ["#FFD700", "#FF4757", "#FF6B35", "#FFFFFF", "#E84393", "#00CEC9", "#FDCB6E"];
  const count = 160;
  const particles: Confetti[] = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width * (0.2 + Math.random() * 0.6),
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 18 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.25,
      alpha: 1
    });
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.4;
      p.vx *= 0.985;
      p.rotation += p.rotV;
      p.alpha -= 0.013;
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

// ===================== 抽奖操作 =====================
const onDraw = async () => {
  if (spinning.value || loading.value) return;

  if (drawChances.value <= 0) {
    showFailToast("您的抽奖次数已用尽！");
    return;
  }

  loading.value = true;
  spinning.value = true;
  showLoadingToast({ message: "正在开奖...", forbidClick: true, duration: 0 });

  try {
    // 将前端配置的 6 款奖品及权重传给后端进行动态抽奖！
    const payloadPrizes = PRIZE_LIST.map(p => ({
      id: p.id,
      name: p.name,
      image: p.rawImageName,
      weight: p.weight // 前端直接配置的中奖权重
    }));

    const res = await activityDrawApi({
      device_id: deviceId.value,
      prizes: payloadPrizes,
      init_chances: INITIAL_DRAW_CHANCES
    });

    closeToast();
    drawChances.value = res.draw_chances;
    winningRecordId.value = res.record_id || null;

    // 找到中奖奖品在 PRIZE_LIST 中的索引
    const prizeIdx = PRIZE_LIST.findIndex(p => p.id === res.prize_id);
    const targetIdx = prizeIdx !== -1 ? prizeIdx : 0;
    winningPrize.value = PRIZE_LIST[targetIdx];

    // 旋转转盘平滑停在中奖扇区
    spinWheelToPrize(targetIdx, () => {
      spinning.value = false;
      loading.value = false;
      resultVisible.value = true;
      launchConfetti();
    });
  } catch (error: any) {
    closeToast();
    spinning.value = false;
    loading.value = false;
    showFailToast(error?.response?.data?.message || "抽奖遇到问题，请重试");
  }
};

// ===================== 抽奖记录查询 =====================
const openRecords = async () => {
  try {
    showLoadingToast({ message: "加载中...", forbidClick: true });
    const res = await activityRecordsApi(deviceId.value);
    closeToast();
    recordList.value = res || [];
    recordsVisible.value = true;
  } catch (e) {
    closeToast();
    showFailToast("获取抽奖记录失败");
  }
};

// 查看单条记录详情
const openRecordDetail = (record: DrawRecordItem) => {
  currentDetailRecord.value = record;
  recordDetailVisible.value = true;
};

// 从中奖弹窗直接查看记录详情
const viewDetailFromPopup = () => {
  resultVisible.value = false;
  if (winningPrize.value) {
    currentDetailRecord.value = {
      id: winningRecordId.value || Date.now(),
      device_id: deviceId.value,
      prize_id: winningPrize.value.id,
      prize_name: winningPrize.value.name,
      prize_image: winningPrize.value.rawImageName,
      created_at: "刚刚"
    };
    recordDetailVisible.value = true;
  }
};

// 帮助获取对应奖品的图片对象
const getPrizeImageByRecord = (record: DrawRecordItem) => {
  const match = PRIZE_LIST.find(p => p.id === record.prize_id || p.name === record.prize_name);
  return match ? match.image : PRIZE_LIST[0].image;
};

// ===================== 初始化画布尺寸（高清适配） =====================
const setupCanvas = () => {
  // 采样至少 3x 像素比，保证移动端 Retina 屏幕上极其细腻清晰
  const dpr = Math.max(window.devicePixelRatio || 1, 3);
  if (wheelCanvas.value) {
    const displaySize = Math.min(window.innerWidth - 44, 340);
    wheelCanvas.value.width = Math.round(displaySize * dpr);
    wheelCanvas.value.height = Math.round(displaySize * dpr);
    wheelCanvas.value.style.width = `${displaySize}px`;
    wheelCanvas.value.style.height = `${displaySize}px`;
  }
  if (confettiCanvas.value) {
    confettiCanvas.value.width = window.innerWidth;
    confettiCanvas.value.height = window.innerHeight;
  }
};

const onWindowResize = () => {
  setupCanvas();
  drawWheel(wheelAngle.value);
};

// ===================== 初始化 =====================
const initPage = async () => {
  const id = ensureDeviceId();
  try {
    const res = await activityInitApi({
      device_id: id,
      init_chances: INITIAL_DRAW_CHANCES
    });
    drawChances.value = res.draw_chances;
  } catch (e) {
    console.error("Init activity failed", e);
  }
};

onMounted(async () => {
  setupCanvas();
  await preloadImages();
  drawWheel(wheelAngle.value);
  initPage();
  window.addEventListener("resize", onWindowResize);
});

onBeforeUnmount(() => {
  closeToast();
  window.removeEventListener("resize", onWindowResize);
  if (animationId.value) cancelAnimationFrame(animationId.value);
  if (confettiAnim) cancelAnimationFrame(confettiAnim);
});
</script>

<template>
  <div class="lottery-page">
    <!-- 全屏背景氛围与光斑 -->
    <div class="bg-glow glow-top"></div>
    <div class="bg-glow glow-bottom"></div>

    <!-- 庆祝彩纸烟花 Canvas -->
    <canvas ref="confettiCanvas" class="confetti-canvas" />

    <div class="content-wrap">
      <!-- 顶部轻奢标题 -->
      <header class="lottery-header">
        <div class="header-tags">
          <span class="live-pill">
            <span class="dot-pulse"></span>
            限时狂欢进行中
          </span>
          <button class="rule-chip" @click="ruleVisible = true">
            📜 活动说明
          </button>
        </div>

        <h1 class="main-title">幸运大转盘</h1>
        <p class="sub-title">100% 惊喜好礼 · 极速开奖</p>

        <!-- 剩余抽奖次数卡片 -->
        <div class="chance-badge">
          <span class="chance-icon">🎁</span>
          <span class="chance-text">剩余抽奖机会：</span>
          <span class="chance-num">{{ drawChances }}</span>
          <span class="chance-unit">次</span>
        </div>
      </header>

      <!-- 转盘核心区 -->
      <section class="wheel-box">
        <div class="wheel-stage">
          <!-- 立体投影底晕 -->
          <div class="wheel-shadow-ring"></div>

          <!-- 顶部指针 (金色金属尖角指针) -->
          <div class="pointer-wrapper">
            <svg class="pointer-svg" viewBox="0 0 32 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 46L0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8L16 46Z"
                fill="url(#goldGradient)"
              />
              <circle cx="16" cy="12" r="6" fill="#FFF2D6" stroke="#D63031" stroke-width="2" />
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="32" y2="46" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#FFEAA7" />
                  <stop offset="0.5" stop-color="#F39C12" />
                  <stop offset="1" stop-color="#D35400" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <!-- Canvas 转盘本体 (超高清绘制) -->
          <canvas ref="wheelCanvas" class="wheel-canvas" />

          <!-- 中心启动按钮 (点击直接触发抽奖) -->
          <div
            class="center-fab"
            :class="{ disabled: drawChances <= 0 || spinning }"
            @click="onDraw"
          >
            <span class="fab-title">{{ spinning ? "抽奖中" : "GO" }}</span>
          </div>
        </div>

        <!-- 底部主按钮 -->
        <div class="action-wrap">
          <button
            class="primary-draw-btn"
            :class="{ loading: spinning, disabled: drawChances <= 0 }"
            :disabled="spinning || drawChances <= 0"
            @click="onDraw"
          >
            <span class="btn-sparkle">✨</span>
            <span class="btn-text">{{ spinning ? "好运计算中..." : "立即点击抽奖" }}</span>
            <span class="btn-sub">（剩余 {{ drawChances }} 次机会）</span>
          </button>

          <!-- 快捷操作栏：查看中奖记录 -->
          <div class="quick-nav">
            <button class="nav-btn" @click="openRecords">
              <span class="nav-icon">📜</span>
              <span>查看抽奖记录</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 奖品展台 (6大实物豪礼展示) -->
      <section class="prizes-showcase">
        <div class="showcase-header">
          <span class="header-line"></span>
          <span class="header-text">豪华奖品一览</span>
          <span class="header-line"></span>
        </div>

        <div class="prize-card-grid">
          <div
            v-for="item in PRIZE_LIST"
            :key="item.id"
            class="prize-item-card"
          >
            <div class="card-img-wrap">
              <img :src="item.image" :alt="item.name" class="card-img" />
              <div class="card-tag">奖品</div>
            </div>
            <div class="card-title">{{ item.name }}</div>
          </div>
        </div>
      </section>
    </div>

    <!-- 中奖结果弹窗 (带大图与动效) -->
    <van-popup
      v-model:show="resultVisible"
      round
      closeable
      position="center"
      :style="{ background: 'transparent', width: '88%' }"
    >
      <div v-if="winningPrize" class="result-card">
        <div class="result-burst"></div>
        <div class="result-badge">🎉 恭喜中奖！</div>

        <div class="result-img-box">
          <img :src="winningPrize.image" :alt="winningPrize.name" class="result-img" />
        </div>

        <div class="result-prize-title">{{ winningPrize.name }}</div>
        <p class="result-note">好运爆棚！奖品已存入您的中奖记录</p>

        <div class="result-btn-row">
          <button class="result-btn secondary" @click="viewDetailFromPopup">
            查看详情
          </button>
          <button
            class="result-btn primary"
            @click="resultVisible = false"
          >
            {{ drawChances > 0 ? "继续抽奖" : "确定" }}
          </button>
        </div>
      </div>
    </van-popup>

    <!-- 抽奖历史记录弹窗 -->
    <van-popup
      v-model:show="recordsVisible"
      position="bottom"
      round
      class="popup-sheet"
      :style="{ height: '65vh' }"
    >
      <div class="sheet-container">
        <div class="sheet-bar"></div>
        <div class="sheet-title">
          <span>📜 我的抽奖记录</span>
          <van-icon name="cross" class="sheet-close" @click="recordsVisible = false" />
        </div>

        <div v-if="recordList.length > 0" class="records-list">
          <div
            v-for="rec in recordList"
            :key="rec.id"
            class="record-item"
            @click="openRecordDetail(rec)"
          >
            <img :src="getPrizeImageByRecord(rec)" class="record-thumb" />
            <div class="record-info">
              <div class="record-name">{{ rec.prize_name }}</div>
              <div class="record-time">{{ rec.created_at }}</div>
            </div>
            <div class="record-action">
              <span class="status-tag">已中奖</span>
              <span class="detail-link">详情 &gt;</span>
            </div>
          </div>
        </div>

        <div v-else class="records-empty">
          <div class="empty-icon">🎁</div>
          <p class="empty-text">您还没有抽奖记录呢</p>
          <p class="empty-sub">快去转动大转盘抽取幸运豪礼吧！</p>
        </div>
      </div>
    </van-popup>

    <!-- 单条中奖记录详情弹窗 -->
    <van-popup
      v-model:show="recordDetailVisible"
      round
      closeable
      position="center"
      :style="{ background: 'transparent', width: '84%' }"
    >
      <div v-if="currentDetailRecord" class="detail-card">
        <div class="detail-header">奖品详情</div>
        <div class="detail-img-box">
          <img :src="getPrizeImageByRecord(currentDetailRecord)" class="detail-img" />
        </div>
        <div class="detail-name">{{ currentDetailRecord.prize_name }}</div>
        <div class="detail-field">
          <span class="field-label">中奖单号：</span>
          <span class="field-val">#{{ currentDetailRecord.id }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">抽奖时间：</span>
          <span class="field-val">{{ currentDetailRecord.created_at }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">兑奖状态：</span>
          <span class="field-val highlight">已中奖 · 待联系核销</span>
        </div>
        <div class="detail-instruction">
          📌 请截图保留本中奖凭证，联系活动官方客服出示进行兑奖与发货。
        </div>
        <button class="detail-close-btn" @click="recordDetailVisible = false">
          返回
        </button>
      </div>
    </van-popup>

    <!-- 活动说明弹窗 -->
    <van-popup
      v-model:show="ruleVisible"
      position="bottom"
      round
      class="popup-sheet"
      :style="{ maxHeight: '55vh' }"
    >
      <div class="sheet-container">
        <div class="sheet-bar"></div>
        <div class="sheet-title">
          <span>📋 活动规则说明</span>
          <van-icon name="cross" class="sheet-close" @click="ruleVisible = false" />
        </div>
        <div class="rule-content">
          <p class="rule-p">1. 用户进入页面即可直接免费参与大转盘抽奖。</p>
          <p class="rule-p">2. 奖品包含 Apple MacBook pro、iPhone 17 Pro Max、iPhone 17/女神礼盒、iPhone 16、珀莱雅红宝石套装及免单红包等。</p>
          <p class="rule-p">3. 点击“立即抽奖”后大转盘将自动旋转并停留在中奖扇区。</p>
          <p class="rule-p">4. 抽中奖品将实时保存在“抽奖记录”中，可在页面下方随时查询记录与核销详情。</p>
          <p class="rule-p">5. 本活动最终解释权归活动举办方所有。</p>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped lang="less">
.lottery-page {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(180deg, #1C0508 0%, #300C12 40%, #150305 100%);
  color: #fff;
  position: relative;
  padding-bottom: 50px;
}

// 全屏光晕背景
.bg-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  z-index: 0;
}
.glow-top {
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 320px;
  height: 240px;
  background: radial-gradient(circle, rgba(235, 77, 75, 0.45), transparent 70%);
}
.glow-bottom {
  top: 360px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(243, 156, 18, 0.25), transparent 70%);
}

.confetti-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

.content-wrap {
  position: relative;
  z-index: 1;
}

// 头部
.lottery-header {
  padding: 24px 20px 12px;
  text-align: center;
}

.header-tags {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  color: #FFD2D2;
}

.dot-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FF4757;
  box-shadow: 0 0 8px #FF4757;
  animation: blink 1.4s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.rule-chip {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 4px 10px;
  color: #F1F2F6;
  font-size: 11px;
  cursor: pointer;
}

.main-title {
  font-size: 28px;
  font-weight: 900;
  margin: 0;
  letter-spacing: 2px;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFEAA7 60%, #F39C12 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 2px 8px rgba(243, 156, 18, 0.4));
}

.sub-title {
  margin: 4px 0 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 1px;
}

.chance-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, rgba(235, 77, 75, 0.25), rgba(243, 156, 18, 0.25));
  border: 1px solid rgba(254, 202, 87, 0.4);
  padding: 6px 16px;
  border-radius: 30px;
  backdrop-filter: blur(8px);
}

.chance-icon {
  font-size: 14px;
}
.chance-text {
  font-size: 13px;
  color: #FFD8A8;
}
.chance-num {
  font-size: 18px;
  font-weight: 900;
  color: #FFF200;
  margin: 0 2px;
}
.chance-unit {
  font-size: 12px;
  color: #FFD8A8;
}

// 转盘区域
.wheel-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0 24px;
}

.wheel-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.wheel-shadow-ring {
  position: absolute;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 71, 87, 0.35) 0%, transparent 70%);
  filter: blur(14px);
  z-index: 0;
}

.pointer-wrapper {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
}

.pointer-svg {
  width: 30px;
  height: 42px;
}

.wheel-canvas {
  position: relative;
  z-index: 2;
  border-radius: 50%;
  // 硬件加速渲染
  transform: translateZ(0);
}

// 中心按钮
.center-fab {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 58px;
  height: 58px;
  border-radius: 50%;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF4757, #C0392B);
  border: 3px solid #FEE180;
  box-shadow: 0 6px 16px rgba(192, 57, 43, 0.6);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:active:not(.disabled) {
    transform: translate(-50%, -50%) scale(0.92);
  }

  &.disabled {
    filter: grayscale(0.6);
    cursor: not-allowed;
  }
}

.fab-title {
  color: #FFF9E6;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 1px;
}

// 底部主按钮与快速入口
.action-wrap {
  width: 100%;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.primary-draw-btn {
  width: 100%;
  max-width: 320px;
  padding: 14px 20px;
  border-radius: 40px;
  border: none;
  background: linear-gradient(90deg, #FF6B35 0%, #FF4757 50%, #E84393 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 8px 24px rgba(255, 71, 87, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &.disabled {
    background: #57606F;
    box-shadow: none;
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.btn-sparkle {
  font-size: 16px;
}
.btn-text {
  font-size: 15px;
  font-weight: 800;
}
.btn-sub {
  font-size: 12px;
  opacity: 0.9;
}

.quick-nav {
  display: flex;
  gap: 16px;
  margin-top: 4px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 20px;
  padding: 6px 14px;
  color: #F1F2F6;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

// 奖品展台
.prizes-showcase {
  margin-top: 16px;
  padding: 0 16px;
}

.showcase-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.header-line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
}

.header-text {
  font-size: 15px;
  font-weight: 700;
  color: #FFEAA7;
  letter-spacing: 1px;
}

.prize-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.prize-item-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(4px);
}

.card-img-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  background: #fff;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  overflow: hidden;
}

.card-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card-tag {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(214, 48, 49, 0.85);
  color: #fff;
  font-size: 9px;
  padding: 1px 0;
  font-weight: 600;
}

.card-title {
  font-size: 11px;
  color: #F1F2F6;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 35px;
}

// 中奖弹窗
.result-card {
  position: relative;
  background: linear-gradient(180deg, #2D0A10 0%, #170407 100%);
  border: 2px solid #F39C12;
  border-radius: 20px;
  padding: 28px 20px 22px;
  text-align: center;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}

.result-badge {
  font-size: 22px;
  font-weight: 900;
  color: #FFD700;
  margin-bottom: 16px;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.5);
}

.result-img-box {
  width: 130px;
  height: 130px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: #fff;
  padding: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 3px rgba(243, 156, 18, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.result-prize-title {
  font-size: 17px;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 6px;
}

.result-note {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 20px;
}

.result-btn-row {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.result-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;

  &.secondary {
    background: rgba(255, 255, 255, 0.15);
    color: #FFF;
    border: 1px solid rgba(255, 255, 255, 0.25);
  }

  &.primary {
    background: linear-gradient(90deg, #FF6B35, #FF4757);
    color: #FFF;
    box-shadow: 0 4px 14px rgba(255, 71, 87, 0.5);
  }
}

// 底部弹窗面板通用
.popup-sheet {
  background: #1E070B !important;
  color: #FFF;
}

.sheet-container {
  padding: 16px 20px 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sheet-bar {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin: 0 auto 12px;
}

.sheet-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 800;
  color: #FFEAA7;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sheet-close {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

// 记录列表
.records-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:active {
    background: rgba(255, 255, 255, 0.1);
  }
}

.record-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #FFF;
  object-fit: contain;
  padding: 2px;
  flex-shrink: 0;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-name {
  font-size: 13px;
  font-weight: 700;
  color: #FFF;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.record-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.record-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.status-tag {
  background: rgba(235, 77, 75, 0.2);
  color: #FF7675;
  border: 1px solid rgba(235, 77, 75, 0.4);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 600;
}

.detail-link {
  font-size: 11px;
  color: #FFEAA7;
}

.records-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.empty-text {
  font-size: 15px;
  font-weight: 700;
  color: #FFF;
  margin: 0 0 6px;
}
.empty-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

// 记录详情卡片
.detail-card {
  background: linear-gradient(180deg, #2A090E 0%, #150305 100%);
  border: 2px solid #F39C12;
  border-radius: 20px;
  padding: 24px 20px 20px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
  text-align: center;
}

.detail-header {
  font-size: 18px;
  font-weight: 800;
  color: #FFEAA7;
  margin-bottom: 16px;
}

.detail-img-box {
  width: 120px;
  height: 120px;
  background: #FFF;
  border-radius: 12px;
  margin: 0 auto 16px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.detail-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.detail-name {
  font-size: 16px;
  font-weight: 800;
  color: #FFF;
  margin-bottom: 14px;
}

.detail-field {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.field-label {
  color: rgba(255, 255, 255, 0.6);
}
.field-val {
  color: #FFF;
  font-weight: 600;

  &.highlight {
    color: #2ECC71;
  }
}

.detail-instruction {
  background: rgba(243, 156, 18, 0.15);
  border: 1px solid rgba(243, 156, 18, 0.3);
  border-radius: 8px;
  padding: 10px;
  margin: 16px 0 16px;
  font-size: 11px;
  line-height: 1.6;
  color: #FFEAA7;
  text-align: left;
}

.detail-close-btn {
  width: 100%;
  padding: 10px 0;
  border-radius: 24px;
  border: none;
  background: linear-gradient(90deg, #FF6B35, #FF4757);
  color: #FFF;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

// 规则内容
.rule-content {
  padding: 14px 4px 0;
  overflow-y: auto;
}
.rule-p {
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 10px;
}
</style>
