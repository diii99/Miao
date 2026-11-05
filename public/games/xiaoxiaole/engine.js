export const configs = {
  easy: { size: 6, moves: 24, goal: 36, kinds: 5, name: '轻松游玩' },
  medium: { size: 7, moves: 20, goal: 60, kinds: 6, name: '适中挑战' },
  hard: { size: 8, moves: 18, goal: 84, kinds: 7, name: '高手试炼' },
};

export function findMatches(grid) {
  const size = grid.length, hits = new Set();
  for (let direction = 0; direction < 2; direction++) {
    for (let line = 0; line < size; line++) {
      const value = i => direction ? grid[i][line] : grid[line][i];
      let start = 0;
      for (let i = 1; i <= size; i++) {
        if (i < size && value(i) === value(start)) continue;
        if (value(start) >= 0 && i - start >= 3) {
          for (let k = start; k < i; k++) hits.add(direction ? k * size + line : line * size + k);
        }
        start = i;
      }
    }
  }
  return [...hits].map(i => [Math.floor(i / size), i % size]);
}

export function swap(grid, a, b) {
  [grid[a[0]][a[1]], grid[b[0]][b[1]]] = [grid[b[0]][b[1]], grid[a[0]][a[1]]];
}

export function findMove(grid) {
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid.length; c++) {
    for (const b of [[r, c + 1], [r + 1, c]]) {
      if (b[0] >= grid.length || b[1] >= grid.length || grid[r][c] === grid[b[0]][b[1]]) continue;
      const a = [r, c];
      swap(grid, a, b);
      const matches = findMatches(grid);
      swap(grid, a, b);
      if (matches.some(([y, x]) => (y === r && x === c) || (y === b[0] && x === b[1]))) return [a, b];
    }
  }
  return null;
}

export function shuffled(values, rng = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createBoard(size, pool, rng = Math.random) {
  // Choose from valid candidates rather than retrying the same random value.
  const grid = Array.from({ length: size }, () => Array(size).fill(-1));
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    const allowed = pool.filter(v => !(c > 1 && grid[r][c - 1] === v && grid[r][c - 2] === v)
      && !(r > 1 && grid[r - 1][c] === v && grid[r - 2][c] === v));
    grid[r][c] = allowed[Math.floor(rng() * allowed.length)];
  }
  if (!findMove(grid)) {
    // A B A / C A C guarantees one swap, even with a constant RNG.
    const [a, b, c] = pool;
    grid[0].splice(0, 3, a, b, a);
    grid[1].splice(0, 3, c, a, c);
    // Refill the rest around this seed to avoid accidental starting matches.
    for (let r = 0; r < size; r++) for (let col = 0; col < size; col++) {
      if (r < 2 && col < 3) continue;
      const allowed = pool.filter(v => !(col > 1 && grid[r][col - 1] === v && grid[r][col - 2] === v)
        && !(r > 1 && grid[r - 1][col] === v && grid[r - 2][col] === v));
      grid[r][col] = allowed[Math.floor(rng() * allowed.length)];
    }
  }
  return grid;
}

export function refill(grid, pool, rng = Math.random) {
  const result = grid.map(row => [...row]);
  for (let c = 0; c < grid.length; c++) {
    const values = grid.map(row => row[c]).filter(v => v >= 0);
    for (let r = grid.length - 1; r >= 0; r--) result[r][c] = values.length ? values.pop() : pool[Math.floor(rng() * pool.length)];
  }
  return result;
}

export function reshuffle(grid, pool, rng = Math.random) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const values = shuffled(grid.flat(), rng);
    const next = grid.map((_, r) => values.slice(r * grid.length, (r + 1) * grid.length));
    if (!findMatches(next).length && findMove(next)) return next;
  }
  return createBoard(grid.length, pool, rng);
}
