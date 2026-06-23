/**
 * 岛主之死（Coral Bay）测试配置
 * 文件：games/island-death/island-death.html
 */
export default {
  gameName: 'Coral Bay',
  htmlFile: 'games/island-death/island-death.html',
  engine: 'SugarCube',
  // 岛主之死的命名规范：4 位时间码（年月）+ 地点 + 人物；或 2 位时间码
  namingPattern: '^[0-9]{2}(-[0-9]{2})?-[A-Za-z0-9@](-?[A-Za-z0-9@]+)*$',
  metaPrefix: '00-',
  metaFiles: ['readme', 'list-of-names', 'invitation', 'references', 'act-structure', 'audio-recovery', 'truth', 'coroner', 'manifest'],
  peopleIds: ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','K','@'],
  hiddenFiles: [],
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
  criticalClues: [],
  characterConstraints: [],
  hasTestingMode: false,
};
