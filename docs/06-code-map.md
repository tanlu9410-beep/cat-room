# 代码映射表

## 这份文档是干什么的

这份文档记录 `src/` 下每个代码文件的职责，以及它与 `docs/03-systems/` 系统文档的对应关系。  
后续施工时，可以通过这份表快速定位"要改哪个系统，应该去看哪些文件"。

---

## 文件总览

```
src/
├── main.js              入口 & 游戏循环
├── canvas.js            画布上下文 & 通用绘图工具
├── config.js            全局常量（尺寸、计时器、速度、概率）
├── state.js             全局状态对象
│
├── entities/
│   ├── Cat.js           猫实体（6 种类型，状态机 + 绘制）
│   ├── GeminiBot.js     扫地机器人实体（状态机 + 绘制）
│   └── Trash.js         纸团实体（物理 + 绘制）
│
├── systems/
│   ├── renderer.js      帧渲染（深度排序 + 统一 update/draw 调度）
│   ├── room.js          房间背景绘制（墙壁、地板、窗户 + 天气粒子）
│   ├── input.js         鼠标输入（抓取/拖拽/放下 + 纸团卡片弹窗）
│   ├── furniture.js     家具绘制（床、箱子、猫爬架、毛线球、垃圾桶）
│   └── weather.js       天气循环（晴天/雨/雪，粒子生成与更新）
│
└── data/
    ├── cat-definitions.js    6 只固定猫的类型、初始 X、颜色配置
    ├── furniture-defs.js     初始家具列表（类型、位置、尺寸）
    └── trash-library.js      纸团冷知识文本 & 金色纸团文本
```

---

## 文件 → 系统对应关系

| 代码文件 | 对应系统文档 | 说明 |
|---------|------------|------|
| `entities/GeminiBot.js` | sys-01-robot | 机器人 5 种状态（idle/sweep/wait/frenzy/stuck）、白猫出租车、清扫逻辑、金色纸团 |
| `entities/Cat.js` | sys-02-cat-behavior | 6 种猫类型的完整行为状态机、家具交互、社交互动 |
| — | sys-03-daily-care | [待实现] 目前无对应代码 |
| `systems/input.js` | sys-04-daily-interaction | 鼠标抓取/拖拽/放下、纸团卡片弹窗、点击触发社交 |
| — | sys-05-records-and-collection | [待实现] 目前无对应代码 |
| — | sys-06-player-presence | [待实现] 目前无对应代码 |
| `systems/weather.js` | sys-07-environment | 天气循环（晴/雨/雪）、粒子系统 |
| `systems/room.js` | sys-07-environment | 房间背景、窗户渲染、天气视觉效果 |
| `systems/furniture.js` | sys-07-environment | 家具物理更新与绘制 |
| — | sys-08-mature-mode | [待实现] 目前无对应代码 |

---

## 共享模块

| 代码文件 | 说明 |
|---------|------|
| `main.js` | 游戏入口：初始化家具、猫、机器人，启动游戏循环，管理纸团生成 |
| `canvas.js` | 获取画布上下文 `ctx`，提供 `drawShadow()` 椭圆阴影工具函数 |
| `config.js` | 所有数值常量集中管理：画布尺寸、天气参数、纸团参数、机器人参数、猫参数、家具参数 |
| `state.js` | 全局可变状态：天气、粒子、纸团列表、家具列表、猫列表、机器人引用、鼠标位置、抓取对象 |
| `systems/renderer.js` | 帧调度器：收集所有实体 → 按 Y 深度排序 → 统一调用 update/draw |

---

## 数据文件

| 代码文件 | 说明 |
|---------|------|
| `data/cat-definitions.js` | 6 只固定猫的定义：类型名、初始 X 坐标、身体/耳朵/眼睛颜色 |
| `data/furniture-defs.js` | 初始家具列表：床、毛线球、纸箱、猫爬架、垃圾桶的位置和尺寸 |
| `data/trash-library.js` | 普通纸团冷知识（3 条）和金色纸团日记（2 条）的文本内容 |

---

## 当前状态

[已定] 代码已完成 ES6 模块化重构（PR #5）。  
[已定] 实体/系统/数据三层结构已建立。  
[暂定] Cat.js 和 GeminiBot.js 中仍有部分硬编码数值（timer、概率）可进一步提取到 config.js。  
[待实现] sys-03（照料）、sys-05（记录收藏）、sys-06（玩家存在）、sys-08（成熟态）尚无对应代码。
