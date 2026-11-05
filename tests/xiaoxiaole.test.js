import { test, expect } from 'bun:test';
import { configs, createBoard, findMatches, findMove, swap, refill, reshuffle } from '../public/games/xiaoxiaole/engine.js';
import { patterns, themes } from '../public/games/xiaoxiaole/patterns.js';

function seeded(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }

test('all difficulties and themes start without matches and with a legal move', () => {
  for (const cfg of Object.values(configs)) for (const theme of Object.values(themes)) {
    for (let seed = 0; seed < 150; seed++) {
      const pool = theme.pool.slice(0, cfg.kinds);
      const grid = createBoard(cfg.size, pool, seeded(seed));
      expect(findMatches(grid)).toHaveLength(0);
      const before = JSON.stringify(grid), move = findMove(grid);
      expect(move).not.toBeNull();
      expect(JSON.stringify(grid)).toBe(before);
      swap(grid, ...move);
      expect(findMatches(grid).length).toBeGreaterThanOrEqual(3);
      expect(grid.flat().every(v => pool.includes(v))).toBe(true);
    }
  }
});

test('constant random sources still terminate with playable, match-free boards', () => {
  for (const value of [0, .5, .99999]) for (const cfg of Object.values(configs)) {
    const pool = Array.from({ length: cfg.kinds }, (_, i) => i);
    const grid = createBoard(cfg.size, pool, () => value);
    expect(findMatches(grid)).toHaveLength(0);
    expect(findMove(grid)).not.toBeNull();
    const next = reshuffle(grid, pool, () => value);
    expect(findMatches(next)).toHaveLength(0);
    expect(findMove(next)).not.toBeNull();
  }
});

test('crossing matches count each cell once and empty slots never match', () => {
  const grid = [[0, 1, 2, 3, 4], [1, 2, 0, 4, 3], [2, 0, 0, 0, 1], [3, 4, 0, 1, 2], [4, 3, 1, 2, 0]];
  expect(findMatches(grid).map(p => p.join(',')).sort()).toEqual(['1,2', '2,1', '2,2', '2,3', '3,2']);
  expect(findMatches(Array.from({ length: 4 }, () => [-1, -1, -1, -1]))).toEqual([]);
});

test('gravity preserves survivor order, fills every hole, and leaves its input intact', () => {
  const grid = [[0, -1, 1], [-1, 2, -1], [3, -1, 4]];
  const next = refill(grid, [5, 6, 7], () => 0);
  expect(next).toEqual([[5, 5, 5], [0, 5, 1], [3, 2, 4]]);
  expect(grid[0][1]).toBe(-1);
});

test('dead-board recovery produces a stable playable board', () => {
  const dead = Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => (r + c) % 5));
  expect(findMove(dead)).toBeNull();
  const next = reshuffle(dead, [0, 1, 2, 3, 4], seeded(12));
  expect(findMove(next)).not.toBeNull();
  expect(findMatches(next)).toHaveLength(0);
});

test('21 distinct pattern assets exist and every theme supports every difficulty', async () => {
  expect(patterns).toHaveLength(21);
  expect(new Set(patterns.map(p => p.src)).size).toBe(21);
  for (const pattern of patterns) {
    const relative = pattern.src.startsWith('/') ? `../public${pattern.src}` : `../public/games/xiaoxiaole/${pattern.src}`;
    expect(await Bun.file(new URL(relative, import.meta.url)).exists()).toBe(true);
  }
  for (const theme of Object.values(themes)) expect(theme.pool.length).toBeGreaterThanOrEqual(7);
});
