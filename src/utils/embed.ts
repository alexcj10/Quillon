export function embedText(text: string): number[] {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const vec = new Array(256).fill(0);
  for (const w of words) {
    let h = 0;
    for (let i = 0; i < w.length; i++) h = (h * 31 + w.charCodeAt(i)) % 256;
    vec[h] += 1;
  }
  return vec;
}
