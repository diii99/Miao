import { configs, createBoard, findMatches, findMove, swap, refill, reshuffle, shuffled } from './engine.js';
import { patterns, themes } from './patterns.js';

const $ = id => document.getElementById(id);
const board = $('board'), overlay = $('overlay'), card = $('card');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let level = 'medium', theme = 'all', pool = [], grid = [], moves = 0, goal = 0, score = 0, cleared = 0;
let selected = null, hinted = [], busy = false, ended = false, shuffles = 2, round = 0, gesture = null;
let pending = null, modalKind = '', returnFocus = null, suppressClickUntil = 0;
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
const tileAt = ([r, c]) => board.children[r * grid.length + c];
const ready = () => grid.length && !busy && !ended && !overlay.open;
const say = text => { $('tip').textContent = text; };
const bestKey = () => `miao-match-best-v2-${level}-${theme}`;
function readBest() { try { const value = Number(localStorage.getItem(bestKey())); return Number.isFinite(value) ? Math.max(0, value) : 0; } catch { return 0; } }
function saveBest() { try { localStorage.setItem(bestKey(), String(Math.max(readBest(), score))); } catch { /* Storage is optional. */ } }
function pause(ms) {
  return new Promise(resolve => {
    const id = setTimeout(() => { pending = null; resolve(); }, reducedMotion.matches ? 35 : ms);
    pending = { id, resolve };
  });
}
function cancelPending() {
  if (pending) { clearTimeout(pending.id); pending.resolve(); pending = null; }
}
function start(next = level) {
  round++; suppressClickUntil = 0;
  cancelPending();
  level = next;
  const cfg = configs[level];
  moves = cfg.moves; goal = cfg.goal; score = cleared = 0;
  selected = null; hinted = []; busy = ended = false; gesture = null; shuffles = 2;
  pool = shuffled(themes[theme].pool).slice(0, cfg.kinds);
  grid = createBoard(cfg.size, pool);
  closeModal(false);
  document.querySelectorAll('[data-level]').forEach(button => {
    const active = button.dataset.level === level;
    button.classList.toggle('on', active);
    button.setAttribute('aria-pressed', String(active));
  });
  board.replaceChildren();
  board.style.gridTemplateColumns = `repeat(${grid.length}, minmax(0, 1fr))`;
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid.length; c++) {
    const button = document.createElement('button');
    button.className = 'tile'; button.dataset.r = r; button.dataset.c = c;
    const img = document.createElement('img'); img.alt = ''; img.draggable = false;
    button.append(img); board.append(button);
  }
  $('round-patterns').innerHTML = pool.map(v => `<img src="${patterns[v].src}" alt="${patterns[v].name}" title="${patterns[v].name}">`).join('');
  say(`${themes[theme].name} · 本局 ${pool.length} 种图案，连成 3 个即可消除`);
  $('progressbar').style.transition = 'none';
  render(); update();
  $('progressbar').getBoundingClientRect();
  $('progressbar').style.removeProperty('transition');
  $('game').scrollTop = 0;
}
function render(falling = false) {
  grid.forEach((row, r) => row.forEach((v, c) => {
    const button = tileAt([r, c]), pattern = patterns[v], img = button.firstElementChild;
    const changed = button.dataset.value !== String(v);
    button.className = 'tile';
    button.classList.toggle('empty', v < 0);
    button.classList.toggle('selected', Boolean(same(selected, [r, c])));
    button.classList.toggle('hint', hinted.some(p => same(p, [r, c])));
    button.classList.toggle('fall', falling && changed);
    button.dataset.value = v;
    button.setAttribute('aria-label', `${r + 1} 行 ${c + 1} 列，${pattern?.name ?? '空位'}`);
    button.setAttribute('aria-pressed', String(Boolean(same(selected, [r, c]))));
    button.setAttribute('aria-disabled', String(busy || ended));
    if (pattern && img.getAttribute('src') !== pattern.src) img.src = pattern.src;
    if (!pattern) img.removeAttribute('src');
  }));
}
function update() {
  $('moves').textContent = moves; $('score').textContent = score;
  $('moves').parentElement.classList.toggle('low', moves <= 5);
  $('progress').textContent = `${Math.min(cleared, goal)} / ${goal}`;
  const progress = Math.min(100, cleared / goal * 100);
  $('progressbar').style.width = `${progress}%`;
  $('track').setAttribute('aria-valuenow', String(Math.round(progress)));
  $('best').textContent = `最佳 ${Math.max(readBest(), score)}`;
  $('shuffle-count').textContent = shuffles;
  $('hint').disabled = busy || ended;
  $('shuffle').disabled = busy || ended || !shuffles;
  $('help').disabled = busy;
  $('collection').disabled = busy;
  board.setAttribute('aria-busy', String(busy));
}
function choose(r, c) {
  if (!ready()) return;
  hinted = [];
  const next = [r, c];
  if (same(selected, next)) { selected = null; render(); return; }
  if (!selected || Math.abs(selected[0] - r) + Math.abs(selected[1] - c) !== 1) {
    selected = next; say(`${patterns[grid[r][c]].name} · 再选相邻的一格`); render(); return;
  }
  const previous = selected;
  selected = null;
  attempt(previous, next);
}
async function attempt(a, b) {
  if (!ready()) return;
  const token = round;
  busy = true; selected = null; hinted = []; update();
  swap(grid, a, b); render();
  await pause(150);
  if (token !== round) return;
  let hits = findMatches(grid);
  if (!hits.length) {
    swap(grid, a, b); busy = false; render(); update();
    say('还没连成三个，已换回原位 · 不扣步数');
    return;
  }
  moves--;
  let chain = 0;
  while (hits.length) {
    chain++;
    const gained = hits.length * 10 * chain;
    say(chain > 1 ? `连消 ${chain} 次！+${gained} 分` : `消除 ${hits.length} 份好物 · +${gained} 分`);
    hits.forEach(p => tileAt(p).classList.add('pop'));
    await pause(240);
    if (token !== round) return;
    score += gained; cleared += hits.length;
    hits.forEach(([r, c]) => { grid[r][c] = -1; });
    render(); update();
    grid = refill(grid, pool); render(true);
    await pause(210);
    if (token !== round) return;
    hits = findMatches(grid);
    // Bound pathological refill chains without leaving a matched board behind.
    if (chain >= 50 && hits.length) { grid = createBoard(grid.length, pool); hits = []; }
  }
  busy = false;
  saveBest();
  if (cleared >= goal || moves <= 0) {
    ended = true; render(); update(); finish(cleared >= goal); return;
  }
  if (!findMove(grid)) {
    grid = reshuffle(grid, pool);
    say('没有可连的组合，已免费重排 · 不扣步数');
  }
  render(); update();
}
function showModal(kind, html) {
  modalKind = kind;
  returnFocus = document.activeElement;
  card.innerHTML = html;
  if (!overlay.open) overlay.showModal();
  overlay.scrollTop = 0;
}
function closeModal(restore = true) {
  overlay.close();
  if (restore && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
}
function finish(win) {
  showModal('result', `<span class="seal">${win ? '乐' : '再'}</span><div class="eyebrow">${configs[level].name} · ${themes[theme].name}</div><h1 id="dialog-title">${win ? '苗乡欢喜！' : '再试一次'}</h1><div class="large">${score} <small>分</small></div><p>${win ? `收集了 ${cleared} 份好物，还剩 ${moves} 步。` : `还差 ${goal - cleared} 份好物就能完成挑战。`}<br>换一组图案，再遇一份山间欢喜。</p><button class="primary" id="again">再玩一局</button>`);
  $('again').onclick = () => start();
}
function intro() {
  showModal('intro', `<span class="seal">乐</span><div class="eyebrow">21 款好物 · 3 组图案</div><h1 id="dialog-title">苗乡消消乐</h1><p>点击两格或轻轻滑动，交换相邻好物。<br>横向或纵向连成 3 个，就能收集它们。</p><div class="difficulty">${Object.entries(configs).map(([key, cfg]) => `<button data-pick="${key}"><b>${cfg.name}</b><small>${cfg.size}×${cfg.size} · ${cfg.moves} 步收集 ${cfg.goal} 份 · ${cfg.kinds} 种图案</small></button>`).join('')}</div><p class="caption">无效交换不扣步数 · 无解时自动重排</p>`);
  card.querySelectorAll('[data-pick]').forEach(button => { button.onclick = () => start(button.dataset.pick); });
}
function help() {
  showModal('help', `<span class="seal">乐</span><h1 id="dialog-title">好物相连，欢喜相伴</h1><ol class="rules"><li>点击两格或滑动一格，交换上下左右的好物。</li><li>横向或纵向连成 3 个及以上即可消除；交叉相连也能一起消除。</li><li>每份好物 10 分，连续消除可获得倍数加分。</li><li>只有有效交换才扣 1 步，连消不额外扣步。</li><li>提示不限次数；每局可手动重排 2 次。没有可消组合时自动免费重排。</li></ol><p>切换难度或图案集会开始新一局。<br>键盘：方向键移动焦点，空格或回车选择。</p><button class="primary" id="resume">继续本局</button>`);
  $('resume').onclick = () => closeModal();
}
function collection() {
  showModal('collection', `<button id="close-collection" class="close-top">返回游戏 ×</button><h1 id="dialog-title">苗乡好物图鉴</h1><p>21 款小小图案 · 绿色边框为本局好物</p><div class="collection-grid">${patterns.map((p, i) => `<div class="collection-item ${pool.includes(i) ? 'active' : ''}"><img src="${p.src}" alt="" loading="lazy"><span>${p.name}</span></div>`).join('')}</div><p class="caption">蝶舞、飞鸟、游鱼、团花、旋涡、菱花<br>为游戏创作的装饰图形。</p><button class="primary" id="resume">继续本局</button>`);
  $('resume').onclick = $('close-collection').onclick = () => closeModal();
}
board.addEventListener('click', event => {
  if (performance.now() < suppressClickUntil && event.detail !== 0) return;
  const button = event.target.closest('.tile');
  if (button) choose(Number(button.dataset.r), Number(button.dataset.c));
});
board.addEventListener('pointerdown', event => {
  const button = event.target.closest('.tile');
  if (!button || !ready() || !event.isPrimary || event.button !== 0) return;
  suppressClickUntil = 0;
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, cell: [Number(button.dataset.r), Number(button.dataset.c)] };
  button.setPointerCapture(event.pointerId);
});
board.addEventListener('pointerup', event => {
  if (!gesture || gesture.id !== event.pointerId) return;
  const { x, y, cell } = gesture; gesture = null;
  const dx = event.clientX - x, dy = event.clientY - y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 16) return;
  suppressClickUntil = performance.now() + 450;
  const target = [cell[0] + (Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0), cell[1] + (Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) : 0)];
  if (target.some(v => v < 0 || v >= grid.length)) return;
  attempt(cell, target);
});
board.addEventListener('pointercancel', () => { gesture = null; });
board.addEventListener('lostpointercapture', () => { gesture = null; });
board.addEventListener('keydown', event => {
  const steps = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  const button = event.target.closest('.tile'), step = steps[event.key];
  if (!button || !step) return;
  event.preventDefault();
  const next = [Number(button.dataset.r) + step[0], Number(button.dataset.c) + step[1]];
  if (next.every(v => v >= 0 && v < grid.length)) tileAt(next).focus({ preventScroll: true });
});
$('hint').onclick = () => {
  if (!ready()) return;
  selected = null; hinted = findMove(grid) ?? [];
  render(); say('金色边框的两格可以交换 · 提示不扣步数');
};
$('shuffle').onclick = () => {
  if (!ready() || !shuffles) return;
  shuffles--; selected = null; hinted = [];
  grid = reshuffle(grid, pool); render(true); update(); say('好物已重新排列 · 分数和步数保留');
};
$('restart').onclick = () => start();
$('help').onclick = help; $('collection').onclick = collection;
$('theme').title = '切换图案集会开始新一局';
$('theme').onchange = event => { theme = event.target.value; start(); };
document.querySelectorAll('[data-level]').forEach(button => { button.onclick = () => start(button.dataset.level); button.title = '切换难度会开始新一局'; });
overlay.addEventListener('cancel', event => {
  event.preventDefault();
  if (modalKind === 'help' || modalKind === 'collection') closeModal();
});
// Prepare a playable preview under the introduction, without beginning a move.
start(); intro();
