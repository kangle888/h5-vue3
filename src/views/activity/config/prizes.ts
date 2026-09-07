import img1 from "@/assets/images/1.jpg";
import img2 from "@/assets/images/2.jpg";
import img3 from "@/assets/images/3.jpg";
import img4 from "@/assets/images/4.jpg";
import img5 from "@/assets/images/5.jpg";
import img6 from "@/assets/images/6.jpg";

export interface PrizeConfig {
  id: number;
  name: string;
  shortName: string;
  image: string;
  rawImageName: string;
  weight: number; // 中奖概率权重：前端可随时在此调整，传给后端计算中奖结果
  bgColor: string;
  textColor: string;
}

/** 默认用户初始抽奖次数（可在前端直接修改） */
export const INITIAL_DRAW_CHANCES = 300;

/**
 * 6 大奖品配置列表：
 * 抽奖概率权重 weight 越大，中奖几率越高。
 */
export const PRIZE_LIST: PrizeConfig[] = [
  {
    id: 1,
    name: "1台Apple MacBook pro",
    shortName: "MacBook Pro",
    image: img1,
    rawImageName: "1.jpg",
    weight: 5,
    bgColor: "#FFF6EF",
    textColor: "#B33928"
  },
  {
    id: 2,
    name: "1台iPhone17 pro Max",
    shortName: "iPhone17 Pro Max",
    image: img2,
    rawImageName: "2.jpg",
    weight: 5,
    bgColor: "#FFFFFF",
    textColor: "#B33928"
  },
  {
    id: 3,
    name: "1台iPhone17基础款/女神礼盒",
    shortName: "iPhone17/礼盒",
    image: img3,
    rawImageName: "3.jpg",
    weight: 10,
    bgColor: "#FFF6EF",
    textColor: "#B33928"
  },
  {
    id: 4,
    name: "1台iPhone16",
    shortName: "iPhone 16",
    image: img4,
    rawImageName: "4.jpg",
    weight: 15,
    bgColor: "#FFFFFF",
    textColor: "#B33928"
  },
  {
    id: 5,
    name: "2套珀莱雅红宝石套装",
    shortName: "珀莱雅套装",
    image: img5,
    rawImageName: "5.jpg",
    weight: 25,
    bgColor: "#FFF6EF",
    textColor: "#B33928"
  },
  {
    id: 6,
    name: "红包1789+免单",
    shortName: "1789红包+免单",
    image: img6,
    rawImageName: "6.jpg",
    weight: 40,
    bgColor: "#FFFFFF",
    textColor: "#B33928"
  }
];
