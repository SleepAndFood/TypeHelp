#!/usr/bin/env node
/**
 * 从 SugarCube HTML 中提取命令列表
 * 用法：node scripts/extract-router.js <game.html>
 */
import * as cheerio from 'cheerio';
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('用法: node scripts/extract-router.js <game.html>');
  process.exit(1);
}
const html = readFileSync(file, 'utf-8');
const $ = cheerio.load(html);

const box = $('tw-passagedata[name="Box"]').html() || '';
// 匹配 $command.split(" ")[0] is "xxx" 或 $command is "xxx"
const re1 = /\$command\.split\(["']\s*["']\)\[0\]\s+is\s+["']([^"']+)["']/g;
const re2 = /\$command\s+is\s+["']([^"']+)["']/g;

const set = new Set();
let m;
while ((m = re1.exec(box)) !== null) set.add(m[1]);
while ((m = re2.exec(box)) !== null) set.add(m[1]);

console.log(JSON.stringify([...set], null, 2));
