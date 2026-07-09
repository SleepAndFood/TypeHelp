/**
 * 默认游戏配置（通用模板）
 * 实际剧本的字段应通过 games/<key>/test.config.js 覆盖
 */
export default {
  gameName: 'TxtGame Default',
  engine: 'SugarCube',
  htmlFile: null,
  // 命名规则（场景 passage）：两位数字-两到三位字母-数字编号链
  namingPattern: '^[0-9]{2}-[A-Za-z]{2,3}(-[0-9A-Za-z]+)+$',
  metaPrefix: '00-',
  metaFiles: [],
  // 人物系统
  peopleIds: [],
  hiddenFiles: [],
  narratorId: '@',
  // 命令系统
  commands: {
    alwaysAvailable: ['help', 'list', 'save', 'back'],
    unlockable: ['name', 'note', 'find', 'title', 'act', 'hangman'],
  },
  commandRouterPassage: 'Box',
  // 时间线
  timeline: {
    extractFrom: 'passageName',
    timeCodePosition: 0,
    timeCodeLength: 2,
    locationPattern: "''([^']+)''",
  },
  // 关键线索
  criticalClues: [],
  // 人物属性约束
  characterConstraints: [],
  // 测试模式
  hasTestingMode: false,
  testingVariable: '$testing',
  testingPassage: 'Testing vars',
  // 推理充分性测试（L6）
  reasoning: {
    enabled: false,        // 默认关闭，剧本通过 test.config.js 显式开启
    maxSteps: 30,
    startPassage: '00-readme',
    endingPassages: [],
    gracePeriod: false,    // 新剧本可设 true 获得 30 天豁免
  },
};
