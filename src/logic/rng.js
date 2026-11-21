// Gerador pseudoaleatório determinístico (mulberry32). Permite testes reproduzíveis.
export function createRng(seed = Date.now()) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, maxExclusive) => min + Math.floor(next() * (maxExclusive - min)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    weighted(items, weightOf) {
      const total = items.reduce((a, it) => a + weightOf(it), 0);
      let r = next() * total;
      for (const it of items) {
        r -= weightOf(it);
        if (r < 0) return it;
      }
      return items[items.length - 1];
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

// Converte uma string (ex.: data "2026-11-21") em semente numérica estável.
export function seedFromString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
