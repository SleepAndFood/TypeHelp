/**
 * Galley Villa（原版 TypeHelp）测试配置
 * 文件：games/galley-villa/TypeHelp.html
 */
export default {
  gameName: 'Galley Villa',
  htmlFile: 'games/galley-villa/TypeHelp.html',
  engine: 'SugarCube',
  namingPattern: '^[0-9]{2}-[A-Za-z]{2,3}(-[0-9A-Za-z@]+)+$',
  metaPrefix: '00-',
  metaFiles: ['readme', 'list-of-names', 'invitation', 'references', 'act-structure', 'audio-recovery'],
  // TypeHelp 引擎内部辅助 passage（命名不符合默认规则）
  systemPassages: ['message-', 'message2-'],
  peopleIds: ['1','2','3','4','5','6','7','8','9','10','11','12','K','@'],
  hiddenFiles: ['00-dream', '00-final-note', '25-WI-K'],
  commands: {
    alwaysAvailable: ['help', 'list', 'save', 'back'],
    unlockable: ['name', 'note', 'find', 'title', 'act', 'hangman'],
  },
  commandRouterPassage: 'Box',
  timeline: {
    extractFrom: 'passageName',
    timeCodePosition: 0,
    timeCodeLength: 2,
    locationPattern: "''([^']+)''",
  },
  criticalClues: [
    { keyword: '钢琴', minAppearances: 2, description: '钢琴作为召集信号' },
    { keyword: '怀表', minAppearances: 2, description: '怀表线索' },
  ],
  characterConstraints: [],
  hasTestingMode: true,
  testingVariable: '$testing',
  testingPassage: 'Testing vars',
};
