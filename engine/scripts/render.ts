#!/usr/bin/env bun
// Offline renderer. Drives the app in headless Chrome (?export=1) and either
//   stills:  bun scripts/render.ts stills --t 1.5,23,40.2 [--only id1,id2] [--out dir]
//   sheet:   bun scripts/render.ts sheet --from 20 --to 35 [--n 12] [--cols 4] [--only ids] [--out file.png]   (or --times a,b,c | --cuts)
//   plates:  bun scripts/render.ts plates   (renders one representative JPEG per plate into public/plates/ (used by the outro's rewind), times from plates.json or entry midpoints)
//   perf:    bun scripts/render.ts perf --from 20 --to 25 [--only ids] [--samples 1] [--shutter 0.5]   (avg ms per frame incl. GPU sync and the export's pixel readback)
//   video:   bun scripts/render.ts video [--from 0] [--to 156.65] [--fps 60] [--crf 16] [--x264 aq-mode=3] [--samples 1] [--shutter 0.5] [--out ../out/pdoom.mp4] [--noaudio]
//            --samples N averages N sub-frames per frame over shutter×(1/fps): motion blur + temporal AA;
//            --samples auto picks the count per frame (4, 12, 36, 108 or 324, see Engine.render)
//   --scale N (all modes): render at N× the 1920x1080 layout (--scale 2 = true 3840x2160); stills are then saved
//            full-res from the pixel buffer, videos are encoded at the physical size.
// Uses the Vite dev server at --url (default http://localhost:5173); starts a private one if unreachable.
import { chromium, type Page } from 'playwright-core';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const mode = argv[0] ?? 'stills';
const opt = (k: string, d?: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (k: string) => argv.includes(`--${k}`);
const APP = path.resolve(import.meta.dir, '..');
const SCALE = Math.max(1, Math.round(+opt('scale', '1')!));
const OW = 1920 * SCALE, OH = 1080 * SCALE; // output size
// --samples N (fixed) or --samples auto [--min-samples 4] [--max-samples 324] [--tol 3] (adaptive, see Engine.render)
const SAMPLES = opt('samples', '1') === 'auto'
  ? { min: +opt('min-samples', '4')!, max: +opt('max-samples', '324')!, tol: +opt('tol', '3')! }
  : +opt('samples', '1')!;
const hist = (h: Record<string, number>) => Object.entries(h).sort((a, b) => +a[0] - +b[0]).map(([k, v]) => `${k}:${v}`).join(' ');
const ROOT = path.resolve(APP, '..');
const TAKE = opt('take', 'demo')!;

async function reachable(url: string) {
  try { const r = await fetch(url, { signal: AbortSignal.timeout(1500) }); return r.ok; } catch { return false; }
}

async function ensureServer(): Promise<{ url: string; stop: () => void }> {
  const url = opt('url', 'http://localhost:5173')!;
  if (await reachable(url)) return { url, stop: () => {} };
  const port = 5300 + Math.floor(Math.random() * 500);
  // no live reload: a file saved mid-render must not reload the page
  const proc = Bun.spawn(['bunx', 'vite', '--port', String(port), '--strictPort'], { cwd: APP, stdout: 'ignore', stderr: 'ignore', env: { ...process.env, PDOOM_NO_HMR: '1' } });
  const u = `http://localhost:${port}`;
  for (let i = 0; i < 100 && !(await reachable(u)); i++) await Bun.sleep(100);
  return { url: u, stop: () => proc.kill() };
}

async function openPage(url: string) {
  const browser = await chromium.launch({
    channel: process.env.FILM_CHANNEL || undefined,   // Playwright's own Chromium unless FILM_CHANNEL=chrome
    headless: !flag('headed'),
    // FILM_CHROME_ARGS adds switches (space-separated), e.g. a GPU choice: on a Mac with two GPUs headless Chromium
    // took the integrated one (`render.ts gpu` prints which), whatever WebGL's powerPreference asked for
    args: ['--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
      ...(process.env.FILM_CHROME_ARGS ?? '').split(/\s+/).filter(Boolean)],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const logs: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  const only = opt('only');
  const solo = opt('scene');
  await page.goto(`${url}/?export=1&take=${TAKE}${solo ? `&scene=${solo}` : ''}${only ? `&only=${only}` : ''}${SCALE !== 1 ? `&scale=${SCALE}` : ''}`);
  await page.waitForFunction(() => (window as any).__pdoom?.ready || (window as any).__pdoom?.error, null, { timeout: 120000 });
  const err = await page.evaluate(() => (window as any).__pdoom.error);
  if (err) throw new Error(`app failed to boot:\n${err}\n${logs.join('\n')}`);
  const size: [number, number] = await page.evaluate(() => [(window as any).__pdoom.width ?? 1920, (window as any).__pdoom.height ?? 1080]);
  if (size[0] !== OW || size[1] !== OH) throw new Error(`app renders ${size[0]}x${size[1]}, expected ${OW}x${OH} (--scale ${SCALE})`);
  const sceneErrors: string[] = await page.evaluate(() => (window as any).__pdoom.errors);
  if (sceneErrors.length) console.error('SCENE ERRORS:\n' + sceneErrors.join('\n'));
  return { browser, page, logs };
}

async function stills(page: Page, times: number[], outDir: string) {
  mkdirSync(outDir, { recursive: true });
  const files: string[] = [];
  for (const t of times) {
    const k: number = await page.evaluate(([t, s, sh]) => (window as any).__pdoom.still(t, s, sh), [t, SAMPLES, +opt('shutter', '0.5')!] as const);
    const f = path.join(outDir, `f_${t.toFixed(2).padStart(7, '0')}.png`);
    if (typeof SAMPLES !== 'number') console.log(`t=${t}: ${k} sub-frames`);
    // at scale > 1 the canvas is shown downscaled on the page: save the full-res pixel buffer instead
    if (SCALE !== 1) await Bun.write(f, Buffer.from(await page.evaluate(() => (window as any).__pdoom.png()), 'base64'));
    else await page.screenshot({ path: f, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    files.push(f);
  }
  return files;
}

async function sheet(page: Page, times: number[], cols: number, out: string) {
  const dataUrl: string = await page.evaluate(async ({ times, cols }) => {
    const P = (window as any).__pdoom;
    const cw = 480, ch = 270, pad = 4, lab = 18;
    const rows = Math.ceil(times.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * (cw + pad) + pad; cv.height = rows * (ch + lab + pad) + pad;
    const c = cv.getContext('2d')!;
    c.fillStyle = '#222'; c.fillRect(0, 0, cv.width, cv.height);
    const src = document.getElementById('c') as HTMLCanvasElement;
    times.forEach((t: number, i: number) => {
      P.still(t);
      const x = pad + (i % cols) * (cw + pad), y = pad + Math.floor(i / cols) * (ch + lab + pad);
      c.drawImage(src, x, y + lab, cw, ch);
      c.fillStyle = '#ddd'; c.font = '13px monospace'; c.fillText(`${t.toFixed(2)}s`, x + 2, y + 13);
    });
    return cv.toDataURL('image/png');
  }, { times, cols });
  mkdirSync(path.dirname(out), { recursive: true });
  await Bun.write(out, Buffer.from(dataUrl.split(',')[1]!, 'base64'));
}

/** The in-browser encode (default): WebCodecs H.264 chunks to an Annex B file, then remuxed with the audio. --raw keeps
 *  the old path (raw RGBA frames to an x264 ffmpeg), which leaks memory in headless Chromium at this frame size. */
async function videoCodec(page: Page, from: number, to: number, fps: number, out: string) {
  mkdirSync(path.dirname(out), { recursive: true });
  const raw = out.replace(/\.mp4$/, '') + '.h264';
  const mbps = +opt('bitrate', SCALE >= 2 ? '160' : '50')!;
  const codec = SCALE >= 2 ? 'avc1.640034' : 'avc1.64002a';   // High @ 5.2 for 4K60, @ 4.2 for 1080p60
  const sink = Bun.file(raw).writer();
  let bytes = 0, chunks = 0, done = false;
  const t0 = performance.now();
  const server = Bun.serve({
    port: 0,
    fetch(req, srv) { return srv.upgrade(req) ? undefined : new Response('ws only', { status: 400 }); },
    websocket: {
      maxPayloadLength: 64 * 1024 * 1024,
      message(_ws, msg) {
        if (typeof msg === 'string') { if (msg === 'done') done = true; return; }
        sink.write(msg as Uint8Array); bytes += (msg as Uint8Array).byteLength; chunks++;
        if (chunks % 60 === 0) {
          const el = (performance.now() - t0) / 1000, total = Math.round(to * fps) - Math.round(from * fps);
          process.stdout.write(`\r${chunks}/${total} frames  ${(chunks / el).toFixed(1)} fps  ${(bytes / 1e6).toFixed(0)} MB  eta ${((total - chunks) / (chunks / el)).toFixed(0)}s   `);
        }
      },
    },
  });
  const used: Record<string, number> = await page.evaluate((o) => (window as any).__pdoom.stream(o),
    { from, to, fps, ws: `ws://localhost:${server.port}`, codec: { codec, bitrate: mbps * 1e6 }, samples: SAMPLES, shutter: +opt('shutter', '0.5')! });
  for (let i = 0; i < 400 && !done; i++) await Bun.sleep(10);
  await sink.end();
  server.stop();
  // remux in two passes: (1) the Annex B stream at fps, tagged BT.709 limited range (-fflags +genpts -r: the raw
  // demuxer's -framerate alone mistimed VideoToolbox's stream, 3600 frames as 0.69 s); (2) the take's audio for
  // [from, to) added to that file (in one pass the raw packets' unset timestamps made -shortest drop the audio track)
  const FFB = process.env.FILM_FFMPEG || 'ffmpeg';
  const run = async (a: string[]) => { const p = Bun.spawn([FFB, '-y', '-loglevel', 'error', ...a], { stdout: 'inherit', stderr: 'inherit' }); await p.exited; if (p.exitCode !== 0) throw new Error(`ffmpeg failed (${p.exitCode}): ${a.join(' ')}`); };
  const vOnly = flag('noaudio') ? out : out.replace(/\.mp4$/, '') + '.video.mp4';
  await run(['-fflags', '+genpts', '-r', String(fps), '-f', 'h264', '-i', raw, '-c:v', 'copy',
    '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-movflags', '+faststart', vOnly]);
  if (!flag('noaudio')) {
    const audio = path.join(ROOT, `takes/${TAKE}/audio.wav`);
    await run(['-i', vOnly, '-ss', String(from), '-t', String(to - from), '-i', audio, '-map', '0:v', '-map', '1:a',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-shortest', '-movflags', '+faststart', out]);
    await Bun.file(vOnly).delete();
  }
  if (!flag('keep-h264')) await Bun.file(raw).delete();
  console.log(`\nwrote ${out} (${chunks} frames, ${(bytes / 1e6).toFixed(0)} MB at ${mbps} Mbps target, in ${((performance.now() - t0) / 1000).toFixed(1)}s)`);
  console.log(`sub-frames per frame (count:frames): ${hist(used)}`);
}

async function video(page: Page, from: number, to: number, fps: number, out: string) {
  mkdirSync(path.dirname(out), { recursive: true });
  const crf = opt('crf', '16')!;
  const audio = path.join(ROOT, `takes/${TAKE}/audio.wav`);
  const args = [process.env.FILM_FFMPEG || 'ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${OW}x${OH}`, '-r', String(fps), '-i', 'pipe:0'];
  if (!flag('noaudio')) args.push('-ss', String(from), '-t', String(to - from), '-i', audio);
  // Frames are sRGB (toSRGB in the final pass): convert with the BT.709 matrix and tag the stream,
  // otherwise ffmpeg converts with BT.601 while players and YouTube decode untagged HD as BT.709.
  // scale tags the matrix and range; primaries and transfer need setparams (the -color_* output flags don't reach the stream).
  args.push('-vf', 'vflip,scale=out_color_matrix=bt709,setparams=color_primaries=bt709:color_trc=bt709', '-c:v', 'libx264', '-preset', opt('preset', 'slow')!, '-crf', crf, '-pix_fmt', 'yuv420p', '-tune', 'grain', '-x264-params', opt('x264', 'aq-mode=3')!);
  if (!flag('noaudio')) args.push('-c:a', 'aac', '-b:a', '320k', '-shortest');
  args.push('-movflags', '+faststart', out);
  const ff = Bun.spawn(args, { stdin: 'pipe', stdout: 'inherit', stderr: 'inherit' });
  let frames = 0;
  const total = Math.round(to * fps) - Math.round(from * fps);
  const t0 = performance.now();
  // frames arrive as HTTP POSTs (default) or over a WebSocket (--ws); POSTs are written to ffmpeg in order
  const useWs = flag('ws');
  const queue = new Map<number, Uint8Array>();
  let next = 0, writing: Promise<void> = Promise.resolve();
  const drain = () => (writing = writing.then(async () => {
    while (queue.has(next)) {
      const b = queue.get(next)!; queue.delete(next);
      ff.stdin.write(b); await ff.stdin.flush();
      next++; frames++;
      if (frames % 60 === 0 || frames === total) {
        const el = (performance.now() - t0) / 1000;
        process.stdout.write(`\r${frames}/${total} frames  ${(frames / el).toFixed(1)} fps  eta ${((total - frames) / (frames / el)).toFixed(0)}s   `);
      }
    }
  }));
  const server = Bun.serve({
    port: 0,
    maxRequestBodySize: OW * OH * 4 + 1024,
    async fetch(req, srv) {
      if (req.method === 'POST') {
        const n = +(new URL(req.url).searchParams.get('n') ?? '-1');
        queue.set(n, new Uint8Array(await req.arrayBuffer()));
        await drain();
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
      }
      return srv.upgrade(req) ? undefined : new Response('ws only', { status: 400 });
    },
    websocket: {
      maxPayloadLength: Math.max(64 * 1024 * 1024, OW * OH * 4 + 1024),
      async message(ws, msg) {
        ff.stdin.write(msg as Uint8Array);
        await ff.stdin.flush();
        frames++;
        ws.send(String(frames)); // ack: the page keeps at most a few frames ahead of ffmpeg (bounded memory at 4K)
        if (frames % 60 === 0 || frames === total) {
          const el = (performance.now() - t0) / 1000;
          process.stdout.write(`\r${frames}/${total} frames  ${(frames / el).toFixed(1)} fps  eta ${((total - frames) / (frames / el)).toFixed(0)}s   `);
        }
      },
    },
  });
  const used: Record<string, number> = await page.evaluate((o) => (window as any).__pdoom.stream(o), { from, to, fps, ws: `ws://localhost:${server.port}`, post: useWs ? undefined : `http://localhost:${server.port}/frame`, samples: SAMPLES, shutter: +opt('shutter', '0.5')!, inflight: useWs ? 4 : 2 });
  // wait for all frames to arrive
  while (frames < total) await Bun.sleep(20);
  ff.stdin.end();
  await ff.exited;
  server.stop();
  console.log(`\nwrote ${out} (${frames} frames in ${((performance.now() - t0) / 1000).toFixed(1)}s)`);
  console.log(`sub-frames per frame (count:frames): ${hist(used)}`);
}

const { url, stop } = await ensureServer();
const { browser, page, logs } = await openPage(url);
/** Times past the take's end render black with no error (no plate is active there): refuse them. */
async function inTake(times: number[]) {
  const dur: number = await page.evaluate(() => (window as any).__pdoom.duration);
  const bad = times.filter((t) => !(t >= 0 && t < dur));
  if (bad.length) throw new Error(`time(s) ${bad.join(', ')} outside take '${TAKE}' (0 to ${dur.toFixed(2)} s): they would render black`);
}
try {
  if (mode === 'timeline') {
    // the edit's entries (id, start, end) as JSON, for segmenting renders by the plates each segment needs
    console.log(JSON.stringify(await page.evaluate(() => (window as any).__pdoom.timeline)));
  } else if (mode === 'codecs') {
    // which WebCodecs encoders this browser offers (the in-browser encode path, `video --webcodecs`)
    console.log(JSON.stringify(await page.evaluate(async () => {
      const out: Record<string, any> = {};
      for (const [name, codec, w, h, br] of [['h264 high 4K60', 'avc1.640034', 3840, 2160, 120e6], ['h264 high 1080p60', 'avc1.64002a', 1920, 1080, 40e6],
        ['hevc main 4K60', 'hvc1.1.6.L153.B0', 3840, 2160, 80e6], ['hevc main10 4K60', 'hvc1.2.4.L153.B0', 3840, 2160, 80e6]] as const) {
        try {
          const r = await (window as any).VideoEncoder.isConfigSupported({ codec, width: w, height: h, bitrate: br, framerate: 60, hardwareAcceleration: 'prefer-hardware', latencyMode: 'quality' });
          out[name] = r.supported;
        } catch (e) { out[name] = String(e); }
      }
      return out;
    }), null, 1));
  } else if (mode === 'gpu') {
    console.log(await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2')!;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    }));
  } else if (mode === 'stills') {
    const times = (opt('t') ?? '0').split(',').map(Number);
    await inTake(times);
    const files = await stills(page, times, opt('out', path.join(ROOT, 'out/stills'))!);
    console.log(files.join('\n'));
  } else if (mode === 'sheet') {
    const from = +opt('from', '0')!, to = +opt('to', '10')!, n = +opt('n', '12')!;
    let times = Array.from({ length: n }, (_, i) => from + ((to - from) * i) / Math.max(1, n - 1));
    if (opt('times')) times = opt('times')!.split(',').map(Number);
    if (flag('cuts')) {
      // 4 frames around every timeline boundary: 2 frames before, 2 after
      const tl: { id: string; start: number }[] = await page.evaluate(() => (window as any).__pdoom.timeline);
      times = tl.slice(1).flatMap((e) => [e.start - 0.1, e.start - 1 / 60, e.start + 1 / 60, e.start + 0.1]);
    }
    await inTake(times);
    const out = opt('out', path.join(ROOT, `out/sheets/sheet_${from}-${to}.png`))!;
    await sheet(page, times, +opt('cols', '4')!, out);
    console.log(out);
  } else if (mode === 'plates') {
    const tl: { id: string; start: number; end: number }[] = await page.evaluate(() => (window as any).__pdoom.timeline);
    const figs = ['open', 'loss', 'room', 'shoggoth', 'spacetime', 'ascent', 'bureau', 'leftturn', 'paperclips', 'fuse', 'stack', 'dense', 'loom', 'ilya'];
    const overrides: Record<string, number> = existsSync(path.join(APP, 'plates.json')) ? await Bun.file(path.join(APP, 'plates.json')).json() : {};
    const dir = path.join(APP, 'public/plates');
    mkdirSync(dir, { recursive: true });
    await page.evaluate(() => { (window as any).__pdoom.engine.hudOff = true; });
    for (let i = 0; i < figs.length; i++) {
      const e = tl.find((x) => x.id === figs[i]);
      if (!e) continue;
      const t = overrides[figs[i]!] ?? (e.start + e.end) / 2;
      await page.evaluate((t) => (window as any).__pdoom.still(t, 4, 0.2), t);
      const f = path.join(dir, `fig${String(i + 1).padStart(2, '0')}.jpg`);
      await page.screenshot({ path: f, type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
      console.log(f, t.toFixed(2));
    }
  } else if (mode === 'perf') {
    const from = +opt('from', '0')!, to = +opt('to', '5')!;
    await inTake([from, to - 1e-3]);
    const r = await page.evaluate(async ({ from, to, samples, shutter }) => {
      const P = (window as any).__pdoom;
      const ms: number[] = [];
      const buf = new Uint8Array(P.width * P.height * 4);
      P.still(from);
      const used: Record<number, number> = {};
      for (let t = from; t < to; t += 1 / 60) {
        const a = performance.now();
        const k = P.engine.render(t, 1 / 60, false, samples, shutter);
        used[k] = (used[k] ?? 0) + 1;
        await P.engine.readPixelsAsync(buf);
        ms.push(performance.now() - a);
      }
      ms.sort((a, b) => a - b);
      return { n: ms.length, avg: ms.reduce((a, b) => a + b, 0) / ms.length, p50: ms[ms.length >> 1], p95: ms[Math.floor(ms.length * 0.95)], max: ms[ms.length - 1], used };
    }, { from, to, samples: SAMPLES, shutter: +opt('shutter', '0.5')! });
    console.log(`frames ${r.n}  avg ${r.avg.toFixed(1)}ms  p50 ${r.p50.toFixed(1)}  p95 ${r.p95.toFixed(1)}  max ${r.max.toFixed(1)}  sub-frames ${hist(r.used)}`);
  } else if (mode === 'video') {
    const dur: number = await page.evaluate(() => (window as any).__pdoom.duration);
    await (flag('raw') ? video : videoCodec)(page, +opt('from', '0')!, +opt('to', String(dur))!, +opt('fps', '60')!, path.resolve(opt('out', path.join(ROOT, 'out/film.mp4'))!));
  }
  if (logs.length) console.error('BROWSER LOG:\n' + logs.slice(0, 40).join('\n'));
} finally {
  await browser.close();
  stop();
}
