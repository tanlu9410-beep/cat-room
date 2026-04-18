// 画布与边界
export const W = 800;
export const H = 600;
export const FLOOR_Y = 350;
export const BOUND_PAD = 50;      // 实体活动区边距
export const BOUND_PAD_SMALL = 40; // 纸团/家具边距

// 天气
export const WEATHER_TYPES = ['sunny', 'rain', 'snow'];
export const WEATHER_INIT_TIMER = 5000;
export const WEATHER_MIN_DURATION = 15000;
export const WEATHER_EXTRA_DURATION = 10000;

// 纸团生成
export const TRASH_MAX_COUNT = 15;
export const TRASH_SPAWN_MIN_INTERVAL = 4000;
export const TRASH_SPAWN_EXTRA_INTERVAL = 5000;
export const TRASH_FRICTION = 0.92;
export const TRASH_BOUNCE = -0.5;
export const TRASH_SCATTER_COUNT = 4;
export const TRASH_SCATTER_SPREAD = 40;

// 扫地机器人
export const GEMINI_SPEED = 0.12;
export const GEMINI_RIDER_SPEED_MULT = 0.4;
export const GEMINI_FRENZY_SPEED = 0.4;
export const GEMINI_CLEAN_THRESHOLD = 8;
export const GEMINI_CLEAN_DONE_THRESHOLD = 3;
export const GEMINI_IDLE_TIMER = 5000;
export const GEMINI_SWEEP_TIMER = 20000;
export const GEMINI_WAIT_TIMER = 3000;
export const GEMINI_STUCK_TIMER = 4000;
export const GEMINI_FRENZY_STUCK_TIMER = 30000;
export const GEMINI_FRENZY_COOLDOWN = 5000;
export const GEMINI_IDLE_AFTER_TIMER = 8000;
export const GEMINI_GOLDEN_MAX = 4;
export const GEMINI_RANDOM_STUCK_RATE = 0.0002;

// 猫通用
export const CAT_INIT_Y = 400;
export const CAT_MOVE_SPEED_MULT = 0.05;
export const CAT_BIG_SCALE = 2.25;    // 黑猫、灰猫
export const CAT_NORMAL_SCALE = 1.5;
export const CAT_BIG_RIDER_OFFSET = 35;
export const CAT_NORMAL_RIDER_OFFSET = 25;
export const CAT_TREE_TOP_Y = -85;
export const CAT_CLIMB_SPEED = 0.05;

// 猫行为计时器
export const CAT_SNIFF_TIMER = 1500;
export const CAT_SLEEP_BED_TIMER = 8000;
export const CAT_SIT_BOX_TIMER = 6000;
export const CAT_SIT_TREE_TIMER = 8000;
export const CAT_SCRATCH_TREE_TIMER = 4000;
export const CAT_IN_BIN_TIMER = 8000;
export const CAT_CHASE_YARN_TIMER = 5000;
export const CAT_WINDOW_TIMER = 4000;
export const CAT_GROOM_TIMER = 4000;
export const CAT_CHASE_TIMER = 3000;
export const CAT_SLEEP_TIMER = 3000;
export const CAT_SELF_GROOM_TIMER = 5000;
export const CAT_BELLY_TIMER = 5000;
export const CAT_WANDER_TIMER = 2000;
export const CAT_ZOOMIES_TIMER = 1500;
export const CAT_HIDE_TIMER = 10000;
export const CAT_CLING_TIMER = 6000;

// 家具毛线球摩擦
export const YARN_FRICTION = 0.96;
