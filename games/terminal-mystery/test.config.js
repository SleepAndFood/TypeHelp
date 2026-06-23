/**
 * 沈家山庄事件（早期探索，仅 4 段文件，无 HTML）测试配置
 * 使用分片文件作为 fallback
 */
export default {
  gameName: 'Terminal Mystery',
  htmlFile: null, // 故意为空：触发 parsePassagesFromFiles 路径
  passageFiles: [
    'games/terminal-mystery/00-readme',
    'games/terminal-mystery/00-list-of-names',
    'games/terminal-mystery/00-act-structure',
    'games/terminal-mystery/01-ST-001',
    'games/terminal-mystery/02-LR-234',
    'games/terminal-mystery/03-DR-1458',
    'games/terminal-mystery/04-ST-018',
  ],
  engine: 'SugarCube',
  namingPattern: '^[0-9]{2}-[A-Za-z]{2,3}(-[0-9A-Za-z]+)+$',
  metaPrefix: '00-',
  metaFiles: ['readme', 'list-of-names', 'act-structure'],
  peopleIds: ['1','2','3','4','5','6','7','8','9'],
  hiddenFiles: [],
  commands: {
    alwaysAvailable: ['help', 'list', 'save', 'back'],
    unlockable: ['name', 'note', 'find'],
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
