// scripts/reasoning-simulator-launcher.js
// L6c launcher：读 agent_profile.md，剥离 §3（禁止透露项）/§5（通过标准），
// 组装 Simulator + Grader 提示词并输出给操作者复制粘贴给 AGENT
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// 解析 CLI 参数
const gameArg = process.argv.find(a => a.startsWith('--game='));
const gameKey = gameArg ? gameArg.split('=')[1] : null;
if (!gameKey) {
  console.error('用法: node scripts/reasoning-simulator-launcher.js --game=<key>');
  process.exit(1);
}

const gameDir = join(projectRoot, 'games', gameKey);
const profilePath = join(gameDir, 'agent_profile.md');

let profileContent;
try {
  profileContent = readFileSync(profilePath, 'utf-8');
} catch {
  console.error(`错误: ${profilePath} 不存在。请先产出 agent_profile.md`);
  process.exit(1);
}

// 剥离 §3（禁止透露项）和 §5（通过标准）—— 仅操作者可见，不注入 Simulator
// §3 包含 truth.md 答案索引，§5 包含通过阈值；两者若泄露会让 Simulator 变成"开卷考试"
function stripOperatorOnlySections(content) {
  const sections = content.split(/^(?=## )/m);
  const visible = sections.filter(section => {
    const headerMatch = section.match(/^##\s+(\d+)/);
    if (!headerMatch) return true; // 非数字章节（如前言）保留
    const num = parseInt(headerMatch[1]);
    return num !== 3 && num !== 5; // 剥离 §3 和 §5
  });
  return visible.join('');
}

const simulatorVisibleProfile = stripOperatorOnlySections(profileContent);

// 读取提示词模板
const simulatorPrompt = readFileSync(
  join(projectRoot, '.trae', 'specs', 'typehelp-novel-design', 'prompts', 'inference-simulator.md'),
  'utf-8'
);
const graderPrompt = readFileSync(
  join(projectRoot, '.trae', 'specs', 'typehelp-novel-design', 'prompts', 'inference-grader.md'),
  'utf-8'
);

// 组装并输出（操作者把这段输出整体粘贴给 AGENT 执行两阶段推理）
console.log('========================================');
console.log('Inference Simulator 提示词（阶段 1：黑盒玩家模拟）');
console.log('========================================');
console.log();
console.log(simulatorPrompt);
console.log();
console.log('--- agent_profile.md（Simulator 可见部分，已剥离 §3/§5）---');
console.log(simulatorVisibleProfile);
console.log();
console.log('--- 游戏文件 ---');
console.log(`路径: games/${gameKey}/${gameKey}.html`);
console.log();
console.log('========================================');
console.log('Inference Grader 提示词（阶段 2：白盒判定）');
console.log('========================================');
console.log();
console.log(graderPrompt);
console.log();
console.log('--- truth.md 路径 ---');
console.log(`路径: games/${gameKey}/truth.md`);
console.log();
console.log('--- inference_trace.json 路径（Simulator 产出，Grader 输入）---');
console.log(`路径: games/${gameKey}/inference_trace.json`);
console.log();
console.log('--- static-reasoning.json 路径（L6a 静态分析产出，Grader 交叉验证输入）---');
console.log(`路径: test/reasoning/_reports/${gameKey}.static-reasoning.json`);
