// 명상 음성과 안내음 placeholder(WAV) 생성. 실제 음성으로 교체 전까지 쓴다.
// node scripts/gen-audio-placeholders.js
const fs = require('fs');
const path = require('path');

// 8kHz / 8bit mono: 용량을 작게 유지 (placeholder 용도)
function wav({ seconds, sampleRate = 8000, render }) {
  const n = Math.floor(seconds * sampleRate);
  const data = Buffer.alloc(n);
  for (let i = 0; i < n; i += 1) {
    const t = i / sampleRate;
    const v = Math.max(-1, Math.min(1, render(t, seconds)));
    data.writeUInt8(Math.round((v + 1) * 127.5), i);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

// 아주 낮은 볼륨의 부드러운 배경 톤 (명상 placeholder). 길이는 콘텐츠 분 수와 동일.
const pad = (freq) => (t, total) => {
  const env = Math.min(1, t / 3, (total - t) / 3);
  return 0.06 * env * (Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(2 * Math.PI * freq * 1.5 * t)) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.1 * t));
};

const out = path.join(__dirname, '..', 'assets', 'audio');
fs.mkdirSync(out, { recursive: true });
const files = [
  ['body-scan.wav', 5 * 60, pad(174)],
  ['sense-focus.wav', 3 * 60, pad(196)],
  ['before-sleep.wav', 10 * 60, pad(146)],
  ['cue-tick.wav', 0.08, (t) => 0.4 * Math.sin(2 * Math.PI * 880 * t) * (1 - t / 0.08)],
  ['cue-chime.wav', 0.9, (t) => 0.35 * Math.sin(2 * Math.PI * 523 * t) * Math.exp(-3 * t)],
];
for (const [name, sec, fn] of files) {
  fs.writeFileSync(path.join(out, name), wav({ seconds: sec, render: fn }));
  console.log('wrote', name);
}
