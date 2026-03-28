<script setup lang="ts">
import { useToggleDarkMode } from "@/composables/useToggleDarkMode";

interface NavBarProps {
  title?: string;
  leftArrow?: boolean;
}

const props = withDefaults(defineProps<NavBarProps>(), {
  title: "",
  leftArrow: false
});

const emit = defineEmits<{
  "click-left": [];
}>();

const onClickRight = (event: TouchEvent | MouseEvent) => {
  useToggleDarkMode(event);
};

const onClickLeft = () => {
  emit("click-left");
};
</script>

<template>
  <van-nav-bar
    class="dark-nav-bar"
    :title="props.title"
    :left-arrow="props.leftArrow"
    fixed
    placeholder
    @click-left="onClickLeft"
    @click-right="onClickRight"
  >
    <!-- <template #right>
      <svg-icon class="text-[18px]" :name="useDarkMode() ? 'light' : 'dark'" />
    </template> -->
  </van-nav-bar>
</template>

<style scoped lang="less">
.dark-nav-bar {
  :deep(.van-nav-bar) {
    background: #000;
  }

  :deep(.van-nav-bar__title) {
    color: #fff;
  }

  :deep(.van-icon) {
    color: #fff;
  }

  :deep(.van-nav-bar__text) {
    color: #fff;
  }
}
</style>
