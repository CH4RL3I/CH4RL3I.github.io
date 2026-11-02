import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as model from '../lib/monte-carlo-model.ts';
import * as scene from '../lib/monte-carlo-scene.ts';

// Exercise the actual React effect and canvas renderer, while controlling browser
// events and the animation clock. Geometry, replay timing and model inference are real.
const source = readFileSync(new URL('../components/MonteCarloNet.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  fileName: 'MonteCarloNet.tsx',
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    dispatch(type) { for (const listener of [...(listeners.get(type) ?? [])]) listener({ type }); },
    count() { return [...listeners.values()].reduce((sum, entries) => sum + entries.size, 0); },
  };
}

function mount({ reducedMotion = false, width = 1280, height = 900 } = {}) {
  const windowEvents = eventTarget();
  const documentEvents = eventTarget();
  const mediaEvents = eventTarget();
  const media = { ...mediaEvents, matches: reducedMotion };
  const document = { ...documentEvents, hidden: false, documentElement: { scrollHeight: 4000 } };
  const bounds = { width, height };
  let draws = 0;
  const context2d = {
    setTransform() {}, clearRect() { draws++; }, beginPath() {}, moveTo() {}, lineTo() {},
    bezierCurveTo() {}, arc() {}, fill() {}, stroke() {}, fillRect() {}, strokeRect() {},
    createLinearGradient() { return { addColorStop() {} }; },
  };
  const canvas = { dataset: {}, width: 0, height: 0, getContext: () => context2d, getBoundingClientRect: () => bounds };
  const pendingFrames = new Map();
  const cancelledFrames = [];
  let nextFrame = 0;
  let effect;
  const exports = {};
  const modules = {
    react: { useRef: () => ({ current: canvas }), useEffect: (callback) => { effect = callback; } },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    '@/lib/monte-carlo-model': model,
    '@/lib/monte-carlo-scene': scene,
  };
  const sandbox = vm.createContext({
    exports,
    require(name) {
      if (!(name in modules)) throw new Error(`Unexpected renderer dependency: ${name}`);
      return modules[name];
    },
    document,
    devicePixelRatio: 2,
    innerHeight: height,
    scrollY: 0,
    matchMedia(query) { assert.equal(query, '(prefers-reduced-motion: reduce)'); return media; },
    addEventListener: windowEvents.addEventListener,
    removeEventListener: windowEvents.removeEventListener,
    requestAnimationFrame(callback) { const id = ++nextFrame; pendingFrames.set(id, callback); return id; },
    cancelAnimationFrame(id) { cancelledFrames.push(id); pendingFrames.delete(id); },
  });
  vm.runInContext(compiled, sandbox, { filename: 'MonteCarloNet.cjs' });
  const element = exports.MonteCarloNet();
  assert.equal(element.type, 'canvas');
  assert.equal(typeof effect, 'function');
  const cleanup = effect();
  return {
    canvas, bounds, document, media, windowEvents, documentEvents, mediaEvents, pendingFrames, cancelledFrames,
    get draws() { return draws; },
    state: () => ({ ...canvas.dataset }),
    tick(now) {
      assert.equal(pendingFrames.size, 1, 'exactly one animation callback is scheduled');
      const [id, callback] = pendingFrames.entries().next().value;
      pendingFrames.delete(id);
      callback(now);
    },
    cleanup,
    assertClean() {
      assert.equal(pendingFrames.size, 0);
      assert.equal(windowEvents.count(), 0);
      assert.equal(documentEvents.count(), 0);
      assert.equal(mediaEvents.count(), 0);
    },
  };
}

test('the real renderer animates, pauses while hidden, and resumes without a time jump', () => {
  const page = mount();
  assert.equal(page.draws, 1, 'mount immediately paints a frame');
  assert.equal(page.pendingFrames.size, 1);
  assert.equal(page.canvas.width, 1920, 'pixel density is capped at 1.5');
  page.tick(0);
  for (let now = 50; now <= 6200; now += 50) page.tick(now);
  assert.ok(page.draws > 100, 'normal animation keeps repainting');
  const beforeHide = page.state();
  assert.ok(Number(beforeHide.progress) > 0, 'training playback has advanced before hiding');
  assert.equal(beforeHide.reducedMotion, 'false');
  page.document.hidden = true;
  page.documentEvents.dispatch('visibilitychange');
  assert.equal(page.pendingFrames.size, 0, 'hiding cancels the queued callback');
  assert.ok(page.cancelledFrames.length > 0);
  const hiddenDraws = page.draws;
  page.document.hidden = false;
  page.documentEvents.dispatch('visibilitychange');
  assert.equal(page.draws, hiddenDraws, 'visibility restoration waits for the next frame');
  page.tick(300_000);
  assert.deepEqual(page.state(), beforeHide, 'five minutes away does not advance phase or progress');
  assert.equal(page.draws, hiddenDraws + 1);
  page.tick(300_050);
  assert.equal(page.pendingFrames.size, 1, 'animation continues normally after restoration');
  page.cleanup();
  page.assertClean();
});

test('reduced motion paints the fitted state, repaints on resize, and responds to live preference changes', () => {
  const page = mount({ reducedMotion: true, width: 390, height: 844 });
  assert.deepEqual(page.state(), { phase: 'settled', progress: '1.000', reducedMotion: 'true' });
  assert.equal(page.pendingFrames.size, 0, 'a reduced-motion mount schedules no animation');
  const initialDraws = page.draws;
  page.bounds.width = 768;
  page.bounds.height = 1024;
  page.windowEvents.dispatch('resize');
  assert.equal(page.draws, initialDraws + 1, 'resizing paints a new still frame');
  assert.equal(page.canvas.width, 1152);
  assert.equal(page.canvas.height, 1536);
  assert.deepEqual(page.state(), { phase: 'settled', progress: '1.000', reducedMotion: 'true' });
  assert.equal(page.pendingFrames.size, 0);

  page.media.matches = false;
  page.mediaEvents.dispatch('change');
  assert.equal(page.state().reducedMotion, 'false');
  assert.equal(page.pendingFrames.size, 1, 'disabling reduced motion starts playback');
  page.tick(100);
  page.tick(150);
  const beforeReduce = page.draws;
  page.media.matches = true;
  page.mediaEvents.dispatch('change');
  assert.equal(page.draws, beforeReduce + 1, 'enabling reduced motion immediately replaces animation with a still');
  assert.deepEqual(page.state(), { phase: 'settled', progress: '1.000', reducedMotion: 'true' });
  assert.equal(page.pendingFrames.size, 0);
  assert.ok(page.cancelledFrames.length > 0);

  page.media.matches = false;
  page.mediaEvents.dispatch('change');
  assert.equal(page.pendingFrames.size, 1, 'a second live toggle restarts without duplicate callbacks');
  page.cleanup();
  page.assertClean();
  const afterCleanup = page.draws;
  page.windowEvents.dispatch('resize');
  page.documentEvents.dispatch('visibilitychange');
  page.mediaEvents.dispatch('change');
  assert.equal(page.draws, afterCleanup, 'unmounted effects no longer respond to browser events');
});
