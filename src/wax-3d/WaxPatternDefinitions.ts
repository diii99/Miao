/**
 * Authentic Miao Traditional Batik Patterns (苗族经典非遗蜡染纹样)
 * Clean, elegant vector paths designed for clear in-canvas tracing and embroidery guidance.
 */

export interface MiaoPattern {
  id: string;
  name: string;
  symbol: string;
  subname: string;
  meaning: string;
  difficulty: "初学" | "进阶" | "精通";
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const MIAO_PATTERNS: MiaoPattern[] = [
  {
    id: "butterfly",
    name: "蝴蝶妈妈",
    symbol: "🦋",
    subname: "MaiX Bx · 苗族创生始祖",
    meaning: "苗族神话中孕育天地万物与人类始祖姜央的神圣图腾，象征母性福佑、生生不息。",
    difficulty: "初学",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // Butterfly body
      ctx.ellipse(cx, cy, 14, 55, 0, 0, Math.PI * 2);
      ctx.ellipse(cx, cy - 65, 16, 16, 0, 0, Math.PI * 2);
      // Antennae scrolls
      ctx.moveTo(cx - 6, cy - 78);
      ctx.bezierCurveTo(cx - 35, cy - 110, cx - 60, cy - 80, cx - 45, cy - 65);
      ctx.moveTo(cx + 6, cy - 78);
      ctx.bezierCurveTo(cx + 35, cy - 110, cx + 60, cy - 80, cx + 45, cy - 65);
      // Top Left Wing
      ctx.moveTo(cx - 10, cy - 35);
      ctx.bezierCurveTo(cx - 130, cy - 150, cx - 220, cy - 60, cx - 180, cy + 20);
      ctx.bezierCurveTo(cx - 140, cy + 80, cx - 60, cy + 30, cx - 10, cy + 10);
      // Top Right Wing
      ctx.moveTo(cx + 10, cy - 35);
      ctx.bezierCurveTo(cx + 130, cy - 150, cx + 220, cy - 60, cx + 180, cy + 20);
      ctx.bezierCurveTo(cx + 140, cy + 80, cx + 60, cy + 30, cx + 10, cy + 10);
      // Bottom Left Wing
      ctx.moveTo(cx - 10, cy + 15);
      ctx.bezierCurveTo(cx - 120, cy + 40, cx - 140, cy + 150, cx - 80, cy + 175);
      ctx.bezierCurveTo(cx - 40, cy + 180, cx - 25, cy + 100, cx - 8, cy + 45);
      // Bottom Right Wing
      ctx.moveTo(cx + 10, cy + 15);
      ctx.bezierCurveTo(cx + 120, cy + 40, cx + 140, cy + 150, cx + 80, cy + 175);
      ctx.bezierCurveTo(cx + 40, cy + 180, cx + 25, cy + 100, cx + 8, cy + 45);
      // Wing inner concentric scrolls
      ctx.moveTo(cx - 90, cy - 40);
      ctx.arc(cx - 100, cy - 25, 30, 0, Math.PI * 1.8);
      ctx.moveTo(cx + 90, cy - 40);
      ctx.arc(cx + 100, cy - 25, 30, 0, Math.PI * 1.8);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "sunbird",
    name: "枫木吉鸟",
    symbol: "🦅",
    subname: "吉宇鸟 · 祈福飞升",
    meaning: "守护枫树与蝴蝶蛋的吉祥神鸟，展翅飞翔于天地山川，祈愿祥瑞与安宁。",
    difficulty: "初学",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // Bird head and crest
      ctx.arc(cx - 50, cy - 80, 22, 0, Math.PI * 2);
      ctx.moveTo(cx - 72, cy - 82);
      ctx.lineTo(cx - 105, cy - 75); // Beak
      ctx.lineTo(cx - 70, cy - 68);
      // Crest plumes
      ctx.moveTo(cx - 40, cy - 102);
      ctx.bezierCurveTo(cx - 30, cy - 140, cx, cy - 130, cx - 10, cy - 105);
      ctx.moveTo(cx - 30, cy - 100);
      ctx.bezierCurveTo(cx - 10, cy - 135, cx + 25, cy - 120, cx + 10, cy - 95);
      // Body
      ctx.moveTo(cx - 35, cy - 65);
      ctx.bezierCurveTo(cx + 20, cy - 40, cx + 70, cy + 20, cx + 40, cy + 90);
      ctx.bezierCurveTo(cx + 10, cy + 130, cx - 40, cy + 100, cx - 50, cy + 10);
      ctx.bezierCurveTo(cx - 60, cy - 30, cx - 50, cy - 50, cx - 35, cy - 65);
      // Sweeping Wings
      ctx.moveTo(cx - 20, cy - 20);
      ctx.bezierCurveTo(cx - 60, cy - 120, cx + 40, cy - 160, cx + 120, cy - 130);
      ctx.bezierCurveTo(cx + 180, cy - 100, cx + 160, cy - 30, cx + 50, cy);
      // Long tail feathers
      ctx.moveTo(cx + 25, cy + 105);
      ctx.bezierCurveTo(cx + 80, cy + 150, cx + 160, cy + 180, cx + 175, cy + 140);
      ctx.bezierCurveTo(cx + 180, cy + 100, cx + 100, cy + 110, cx + 30, cy + 85);
      ctx.moveTo(cx + 15, cy + 115);
      ctx.bezierCurveTo(cx + 60, cy + 180, cx + 120, cy + 220, cx + 135, cy + 175);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "sun_disc",
    name: "铜鼓太阳芒",
    symbol: "☀️",
    subname: "十二角芒 · 光芒普照",
    meaning: "古铜鼓面中心太阳图腾，象征十二月份与光明普照，给山林田野带来丰盛收获。",
    difficulty: "初学",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // Center disc
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.arc(cx, cy, 55, 0, Math.PI * 2);
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      // 12 Sun rays (spikes)
      const rays = 12;
      for (let i = 0; i < rays; i++) {
        const a1 = (i * 2 * Math.PI) / rays;
        const a2 = ((i + 0.5) * 2 * Math.PI) / rays;
        const a3 = ((i + 1) * 2 * Math.PI) / rays;
        const rInner = 55;
        const rOuter = 135;
        ctx.moveTo(cx + Math.cos(a1) * rInner, cy + Math.sin(a1) * rInner);
        ctx.lineTo(cx + Math.cos(a2) * rOuter, cy + Math.sin(a2) * rOuter);
        ctx.lineTo(cx + Math.cos(a3) * rInner, cy + Math.sin(a3) * rInner);
      }
      // Surrounding cloud/wave dots
      for (let i = 0; i < 24; i++) {
        const a = (i * 2 * Math.PI) / 24;
        ctx.moveTo(cx + Math.cos(a) * 165 + 4, cy + Math.sin(a) * 165);
        ctx.arc(cx + Math.cos(a) * 165, cy + Math.sin(a) * 165, 4, 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "fern_scroll",
    name: "水涡蕨草纹",
    symbol: "🌀",
    subname: "生命回旋 · 山水共生",
    meaning: "丹寨山间初春萌发的卷草与梯田清泉，代表生命蓬勃舒展与山水自然的和谐。",
    difficulty: "进阶",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // 4-Quadrant symmetrical fern spirals
      const angles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
      angles.forEach((angle) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        // Main spiral
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(40, -30, 90, -80, 130, -50);
        ctx.bezierCurveTo(160, -20, 140, 40, 100, 45);
        ctx.bezierCurveTo(70, 50, 60, 15, 80, 0);
        // Side fern leaves
        ctx.moveTo(35, -20);
        ctx.quadraticCurveTo(60, -55, 50, -65);
        ctx.moveTo(65, -45);
        ctx.quadraticCurveTo(95, -90, 85, -100);
        ctx.moveTo(95, -60);
        ctx.quadraticCurveTo(135, -105, 130, -115);
        ctx.restore();
      });
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "fish_dragon",
    name: "双鱼跃水纹",
    symbol: "🐟",
    subname: "富足丰登 · 戏水生欢",
    meaning: "稻田养鱼与清水江之鱼，象征风调雨顺、五谷丰登与多子多福的富足祈愿。",
    difficulty: "进阶",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // Yin-Yang dual fish rotation
      [0, Math.PI].forEach((rot) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        // Fish 1 body
        ctx.moveTo(0, -90);
        ctx.bezierCurveTo(60, -90, 110, -40, 100, 20);
        ctx.bezierCurveTo(90, 70, 40, 90, 0, 80);
        ctx.bezierCurveTo(-20, 75, -35, 40, -30, 0);
        ctx.bezierCurveTo(-25, -40, -10, -80, 0, -90);
        // Eye
        ctx.moveTo(25, -60);
        ctx.arc(20, -60, 6, 0, Math.PI * 2);
        // Fin & Tail
        ctx.moveTo(95, 0);
        ctx.quadraticCurveTo(145, 10, 135, 45);
        ctx.moveTo(0, 80);
        ctx.bezierCurveTo(20, 130, 60, 155, 30, 170);
        ctx.bezierCurveTo(10, 160, 0, 120, -15, 165);
        // Scales
        ctx.moveTo(35, -20);
        ctx.arc(25, -20, 10, 0, Math.PI);
        ctx.moveTo(60, 0);
        ctx.arc(50, 0, 10, 0, Math.PI);
        ctx.moveTo(35, 20);
        ctx.arc(25, 20, 10, 0, Math.PI);
        ctx.restore();
      });
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "pear_flower",
    name: "苗岭八角花",
    symbol: "🌸",
    subname: "山花初绽 · 八角同心",
    meaning: "苗岭春天盛开的山野梨花与八角星辰，寓意纯洁清雅与四面八方福禄同心。",
    difficulty: "初学",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // Center star
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      // 8 Petals
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        ctx.moveTo(0, -25);
        ctx.bezierCurveTo(-35, -70, -35, -130, 0, -150);
        ctx.bezierCurveTo(35, -130, 35, -70, 0, -25);
        // Petal inner vein
        ctx.moveTo(0, -25);
        ctx.lineTo(0, -125);
        ctx.moveTo(0, -70);
        ctx.lineTo(-15, -95);
        ctx.moveTo(0, -70);
        ctx.lineTo(15, -95);
        ctx.restore();
      }
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "sacred_frog",
    name: "灵蛙祈雨纹",
    symbol: "🐸",
    subname: "蛙声兆丰 · 祈雨甘霖",
    meaning: "古越人与苗民敬仰的雷雨神使，蛙鸣即春雨至，守护稻作梯田水泽。",
    difficulty: "进阶",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // Frog body
      ctx.ellipse(cx, cy, 50, 75, 0, 0, Math.PI * 2);
      // Big round eyes
      ctx.arc(cx - 30, cy - 80, 18, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy - 80, 18, 0, Math.PI * 2);
      // Front webbed arms
      ctx.moveTo(cx - 45, cy - 30);
      ctx.bezierCurveTo(cx - 110, cy - 60, cx - 130, cy - 20, cx - 120, cy + 10);
      ctx.moveTo(cx + 45, cy - 30);
      ctx.bezierCurveTo(cx + 110, cy - 60, cx + 130, cy - 20, cx + 120, cy + 10);
      // Back powerful legs
      ctx.moveTo(cx - 40, cy + 50);
      ctx.bezierCurveTo(cx - 130, cy + 60, cx - 150, cy + 130, cx - 110, cy + 160);
      ctx.bezierCurveTo(cx - 70, cy + 180, cx - 50, cy + 130, cx - 25, cy + 70);
      ctx.moveTo(cx + 40, cy + 50);
      ctx.bezierCurveTo(cx + 130, cy + 60, cx + 150, cy + 130, cx + 110, cy + 160);
      ctx.bezierCurveTo(cx + 70, cy + 180, cx + 50, cy + 130, cx + 25, cy + 70);
      // Back spiral spots
      ctx.moveTo(cx, cy - 30);
      ctx.arc(cx, cy - 15, 15, 0, Math.PI * 2);
      ctx.moveTo(cx, cy + 20);
      ctx.arc(cx, cy + 30, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "bronze_drum",
    name: "千载古铜鼓",
    symbol: "🥁",
    subname: "传世重器 · 盛节鼓乐",
    meaning: "苗乡重器铜鼓，鼓声响彻千山万岭，集聚族人祭祖、欢度盛装芦笙节。",
    difficulty: "进阶",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // Concentric circles with diamond borders
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.arc(cx, cy, 70, 0, Math.PI * 2);
      ctx.arc(cx, cy, 110, 0, Math.PI * 2);
      ctx.arc(cx, cy, 150, 0, Math.PI * 2);
      // Diamond saw-tooth geometric bands
      const teeth = 16;
      for (let i = 0; i < teeth; i++) {
        const a1 = (i * 2 * Math.PI) / teeth;
        const a2 = ((i + 0.5) * 2 * Math.PI) / teeth;
        const a3 = ((i + 1) * 2 * Math.PI) / teeth;
        ctx.moveTo(cx + Math.cos(a1) * 70, cy + Math.sin(a1) * 70);
        ctx.lineTo(cx + Math.cos(a2) * 110, cy + Math.sin(a2) * 110);
        ctx.lineTo(cx + Math.cos(a3) * 70, cy + Math.sin(a3) * 70);
      }
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "centipede",
    name: "避邪纳吉纹",
    symbol: "🐉",
    subname: "多足神兽 · 护佑百安",
    meaning: "深山百足神灵，在苗家刺绣与蜡染中作为辟邪保平安、护佑孩童健康成长的瑞兽。",
    difficulty: "进阶",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // Long curved segmented spine
      ctx.moveTo(cx, cy - 140);
      ctx.bezierCurveTo(cx - 60, cy - 60, cx + 60, cy + 40, cx, cy + 140);
      // Segments and legs
      for (let i = 0; i < 9; i++) {
        const t = (i + 1) / 10;
        const y = cy - 120 + i * 26;
        const xOffset = Math.sin(t * Math.PI * 2) * 25;
        const lx = cx + xOffset;
        // Joint circle
        ctx.moveTo(lx + 8, y);
        ctx.arc(lx, y, 8, 0, Math.PI * 2);
        // Left Leg with sharp hook
        ctx.moveTo(lx - 8, y);
        ctx.quadraticCurveTo(lx - 55, y - 10, lx - 75, y + 15);
        // Right Leg with sharp hook
        ctx.moveTo(lx + 8, y);
        ctx.quadraticCurveTo(lx + 55, y - 10, lx + 75, y + 15);
      }
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "pomegranate",
    name: "榴开百子果",
    symbol: "🏮",
    subname: "百子千孙 · 硕果累累",
    meaning: "饱满多籽的石榴果实，花开吉祥，象征家族人丁兴旺、和美富足。",
    difficulty: "初学",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // Pomegranate outer body
      ctx.moveTo(cx, cy - 70);
      ctx.bezierCurveTo(cx + 90, cy - 60, cx + 110, cy + 60, cx, cy + 95);
      ctx.bezierCurveTo(cx - 110, cy + 60, cx - 90, cy - 60, cx, cy - 70);
      // Crown on top
      ctx.moveTo(cx - 25, cy - 70);
      ctx.lineTo(cx - 35, cy - 110);
      ctx.lineTo(cx - 10, cy - 85);
      ctx.lineTo(cx, cy - 115);
      ctx.lineTo(cx + 10, cy - 85);
      ctx.lineTo(cx + 35, cy - 110);
      ctx.lineTo(cx + 25, cy - 70);
      // Inner seeds
      for (let row = -1; row <= 2; row++) {
        for (let col = -2; col <= 2; col++) {
          if (Math.abs(row) + Math.abs(col) <= 3) {
            ctx.moveTo(cx + col * 26 + 7, cy + row * 24);
            ctx.arc(cx + col * 26, cy + row * 24, 7, 0, Math.PI * 2);
          }
        }
      }
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "skylark",
    name: "苗山云雀栖",
    symbol: "🕊️",
    subname: "春回大地 · 雀跃苗山",
    meaning: "拂晓啼鸣唤醒晨曦的云雀，停驻在苍松翠竹之上，传递春意与喜讯。",
    difficulty: "初学",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.beginPath();
      // Branch
      ctx.moveTo(cx - 150, cy + 60);
      ctx.bezierCurveTo(cx - 40, cy + 50, cx + 60, cy + 80, cx + 150, cy + 70);
      // Bird body
      ctx.arc(cx - 20, cy - 20, 38, 0, Math.PI * 2);
      ctx.arc(cx + 25, cy - 50, 20, 0, Math.PI * 2);
      // Beak
      ctx.moveTo(cx + 42, cy - 52);
      ctx.lineTo(cx + 68, cy - 48);
      ctx.lineTo(cx + 40, cy - 42);
      // Tail
      ctx.moveTo(cx - 50, cy);
      ctx.bezierCurveTo(cx - 120, cy + 20, cx - 140, cy + 60, cx - 125, cy + 40);
      ctx.moveTo(cx - 45, cy + 10);
      ctx.bezierCurveTo(cx - 100, cy + 40, cx - 120, cy + 85, cx - 105, cy + 65);
      // Leaves on branch
      ctx.moveTo(cx + 80, cy + 75);
      ctx.quadraticCurveTo(cx + 110, cy + 40, cx + 130, cy + 45);
      ctx.quadraticCurveTo(cx + 100, cy + 75, cx + 80, cy + 75);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "freehand",
    name: "自由挥洒作画",
    symbol: "✨",
    subname: "随心所欲 · 挥墨点蜡",
    meaning: "不设固定底稿羁绊，以铜刀刀尖为笔、热蜡为墨，在棉布上任意挥洒你心中的山水与花鸟。",
    difficulty: "精通",
    draw: (ctx, w, h) => {
      const cx = w / 2;
      const cy = h / 2;
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, 150, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  },
];
