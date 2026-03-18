<script setup lang="ts">
import { useRouter } from "vue-router";
import NavBar from "@/components/nav-bar/index.vue";
import { useDarkMode } from "@/composables/useToggleDarkMode";

defineOptions({ name: "DemoIndex" });

const router = useRouter();

const navList = [
  { icon: "wap-home-o", name: "主页", route: { name: "Demo" } },
  { icon: "gem-o", name: "工具", route: { name: "Tools" } },
  { icon: "user-o", name: "关于", route: { name: "About" } },
  { icon: "star-o", name: "收藏", route: null },
  { icon: "bell-o", name: "消息通知", route: null },
  { icon: "setting-o", name: "系统设置", route: null },
  { icon: "shield-o", name: "隐私安全", route: null },
  { icon: "question-o", name: "帮助与反馈", route: null }
];

const handleClick = (item: (typeof navList)[0]) => {
  if (item.route) {
    router.push(item.route);
  }
};
</script>

<template>
  <van-config-provider :theme="useDarkMode() ? 'dark' : 'light'">
    <div class="demo-index-page">
      <!-- 顶部导航栏 -->
      <NavBar title="导航示例" :left-arrow="true" @click-left="router.back()" />

      <!-- 导航列表 -->
      <div class="content">
        <van-cell-group inset title="功能导航">
          <van-cell
            v-for="(item, index) in navList"
            :key="index"
            :title="item.name"
            is-link
            clickable
            @click="handleClick(item)"
          >
            <template #icon>
              <van-icon :name="item.icon" class="cell-icon" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </div>
  </van-config-provider>
</template>

<style scoped lang="less">
.demo-index-page {
  min-height: 100vh;
}

.content {
  padding-top: 16px;
}

.cell-icon {
  font-size: 20px;
  margin-right: 10px;
  color: #1989fa;
  line-height: inherit;
}
</style>
