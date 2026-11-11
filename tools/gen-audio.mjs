// Genera audio/<hash>.mp3 para cada texto que la app lee en voz alta.
// Uso: node tools/gen-audio.mjs   (requiere edge-tts en el PATH o EDGE_TTS=/ruta/edge-tts)
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const html = readFileSync('index.html', 'utf8');
const grab = (start, end) => { const i = html.indexOf(start); return html.slice(i + start.length - 1, html.indexOf(end, i) + end.length); };
const Q = eval(grab('const Q = [', '\n      ]'));
const TIT = eval('(' + grab('const TIT = {', '\n      }') + ')');
const EXP = eval('(' + grab('const EXP = {', '\n      }') + ')');

// Debe coincidir con plain() y voiceKey() de index.html
const plain = a => a.replace(/\[([^\]#]+)(#[^\]]*)?\]/g, '$1');
const ttl = s => s.replace(/\s*Pon (un ejemplo|ejemplos)\.$/, '').replace(/^Pon ejemplos de (.*)\.$/, 'Ejemplos de $1');
const voiceKey = t => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };

const texts = new Set();
for (const q of Q) {
  texts.add(q.q);
  if (q.a) texts.add(ttl(q.q) + ' ' + plain(q.a));
  if (EXP[q.id]) texts.add((TIT[q.id] || q.a.split(':')[0]) + '. ' + EXP[q.id]);
}

mkdirSync('audio', { recursive: true });
const bin = process.env.EDGE_TTS || 'edge-tts';
let n = 0;
for (const t of texts) {
  const f = `audio/${voiceKey(t)}.mp3`;
  if (existsSync(f)) continue;
  execFileSync(bin, ['--voice', 'es-ES-ElviraNeural', '--rate=-5%', '--text', t, '--write-media', f]);
  n++;
}
console.log(`${texts.size} textos, ${n} audios nuevos`);
