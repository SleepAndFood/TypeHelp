/**
 * 岛主之死（Coral Bay）测试配置
 * 文件：games/island-death/island-death.html
 */
export default {
  gameName: 'Coral Bay',
  htmlFile: 'games/island-death/island-death.html',
  engine: 'SugarCube',
  // 岛主之死的命名规则（按 cast_id_map.md）：SS-AA-X-Y
  //   SS = 段号（2 位）；AA = 幕号（2 位，可省略）
  //   X = 在场人物缩写组合（用 - 串联多人物，如 QM-ZM-SM-LM-SU）
  //   Y = 在场人数（1 位数字）
  // 因此人物缩写段允许连字符做分隔；其余 token 是纯字母数字
  namingPattern: '^[0-9]{2}(-[0-9]{2})?-[A-Za-z][A-Za-z0-9]*(-[A-Za-z][A-Za-z0-9]*)*-[0-9]{1,2}$',
  metaPrefix: '00-',
  metaFiles: ['readme', 'list-of-names', 'invitation', 'references', 'act-structure', 'audio-recovery', 'truth', 'coroner', 'manifest'],
  // TypeHelp 引擎内部辅助 passage（命名不符合默认规则）
  systemPassages: ['message2-'],
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
