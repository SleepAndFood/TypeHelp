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
  // 推理充分性测试（L6）
  reasoning: {
    enabled: true,
    maxSteps: 30,
    startPassage: '00-00-readme-0',
    endingPassages: ['30-05-PL-1', '00-final-note-0'],  // 结局 passage + final-note
    gracePeriod: false,
    // 隐藏文件虚拟入边：隐藏文件通过命令触发（find/输入文件名），
    // tag 图和 cache.push 无法捕捉，需显式声明触发源
    hiddenFileEdges: [
      { from: '00-00-readme-0', to: '00-dream', via: '输入文件名' },
      { from: '25-05-PL-1', to: '00-chen-video', via: '输入文件名（找到离线硬盘后）' },
      { from: '27-05-PL-1', to: '00-su-identity', via: 'find su（集齐物证后）' },
      { from: '22-04-PL-1', to: '00-meta-warning', via: '自动触发（发现管家死亡规律）' },
    ],
  },
};
