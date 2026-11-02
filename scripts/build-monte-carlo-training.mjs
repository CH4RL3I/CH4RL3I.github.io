/** Reproduce the small, real model whose saved training history drives the background. */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const layers = [3, 5, 5, 2];
const target = { mu: 0.06, sigma: 0.36, horizon: 1 };
const meanScale = 0.35;
const stdScale = 0.35;
const sampleCount = 4096;
const epochs = 2400;
const savedEpochs = new Set([0, 4, 12, 28, 55, 100, 180, 320, 560, 960, 1600, epochs]);

function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rng) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-12, rng()))) * Math.cos(2 * Math.PI * rng());
}

function input(mu, sigma, horizon) {
  return [mu / 0.35, (sigma - 0.36) / 0.3, 2 * horizon - 1];
}

function simulateMoments(mu, sigma, horizon, seed) {
  const rng = random(seed);
  let sum = 0;
  let squareSum = 0;
  for (let i = 0; i < sampleCount; i++) {
    const logReturn = (mu - sigma ** 2 / 2) * horizon + sigma * Math.sqrt(horizon) * normal(rng);
    sum += logReturn;
    squareSum += logReturn * logReturn;
  }
  const mean = sum / sampleCount;
  const std = Math.sqrt(squareSum / sampleCount - mean ** 2);
  return { mean, std };
}

const scenarios = [];
let scenarioIndex = 0;
for (const mu of [-0.25, -0.1, 0.06, 0.2, 0.35]) {
  for (const sigma of [0.12, 0.24, 0.36, 0.48, 0.6]) {
    for (const horizon of [0.25, 0.5, 0.75, 1]) {
      const moments = simulateMoments(mu, sigma, horizon, 71000 + scenarioIndex++);
      scenarios.push({
        input: input(mu, sigma, horizon),
        output: [moments.mean / meanScale, Math.log(moments.std / stdScale)],
        ...moments,
        mu, sigma, horizon,
      });
    }
  }
}
const demo = scenarios.find((s) => s.mu === target.mu && s.sigma === target.sigma && s.horizon === target.horizon);
if (!demo) throw new Error('Missing displayed scenario');

const rng = random(2031);
const weights = layers.slice(1).map((count, l) => Array.from({ length: count }, () => Array.from({ length: layers[l] }, () => normal(rng) * 0.27)));
const biases = layers.slice(1).map((count) => Array(count).fill(0));
biases[2] = [-0.75, Math.log(0.18 / stdScale)];
const sameShape = (value) => Array.isArray(value) ? value.map(sameShape) : 0;
const wm = sameShape(weights), wv = sameShape(weights), bm = sameShape(biases), bv = sameShape(biases);

function forward(x) {
  const activations = [x];
  for (let l = 0; l < weights.length; l++) {
    const prev = activations[l];
    activations.push(weights[l].map((row, j) => {
      const sum = biases[l][j] + row.reduce((value, w, k) => value + w * prev[k], 0);
      return l === weights.length - 1 ? sum : Math.tanh(sum);
    }));
  }
  return activations;
}

function loss() {
  let sum = 0;
  for (const scenario of scenarios) {
    const output = forward(scenario.input).at(-1);
    sum += output.reduce((value, v, j) => value + (v - scenario.output[j]) ** 2, 0);
  }
  return sum / (scenarios.length * 2);
}

const checkpoints = [];
const round = (value) => Array.isArray(value) ? value.map(round) : Number(value.toFixed(8));
function save(epoch) {
  checkpoints.push({ epoch, loss: loss(), weights: round(weights), biases: round(biases) });
}
save(0);
for (let epoch = 1; epoch <= epochs; epoch++) {
  const dw = sameShape(weights), db = sameShape(biases);
  for (const scenario of scenarios) {
    const a = forward(scenario.input);
    let delta = a.at(-1).map((v, j) => (v - scenario.output[j]) / scenarios.length);
    for (let l = weights.length - 1; l >= 0; l--) {
      for (let j = 0; j < weights[l].length; j++) {
        db[l][j] += delta[j];
        for (let k = 0; k < weights[l][j].length; k++) dw[l][j][k] += delta[j] * a[l][k];
      }
      if (l > 0) {
        delta = a[l].map((v, k) => weights[l].reduce((sum, row, j) => sum + row[k] * delta[j], 0) * (1 - v * v));
      }
    }
  }
  // Full-batch Adam; the same seed, samples and iterations reproduce every checkpoint.
  const rate = epoch < 600 ? 0.012 : 0.004;
  const update = (values, gradients, first, second) => {
    for (let j = 0; j < values.length; j++) {
      if (Array.isArray(values[j])) update(values[j], gradients[j], first[j], second[j]);
      else {
        const g = gradients[j];
        first[j] = 0.9 * first[j] + 0.1 * g;
        second[j] = 0.999 * second[j] + 0.001 * g * g;
        values[j] -= rate * (first[j] / (1 - 0.9 ** epoch)) / (Math.sqrt(second[j] / (1 - 0.999 ** epoch)) + 1e-8);
      }
    }
  };
  update(weights, dw, wm, wv);
  update(biases, db, bm, bv);
  if (savedEpochs.has(epoch)) save(epoch);
}

const output = forward(demo.input).at(-1);
const finalMean = output[0] * meanScale;
const finalSigma = Math.exp(output[1]) * stdScale;
const finalMu = finalMean + 0.5 * finalSigma ** 2;
if (Math.abs(finalMu - target.mu) > 0.012 || Math.abs(finalSigma - target.sigma) > 0.012) {
  throw new Error(`Surrogate fit outside display tolerance: mu=${finalMu}, sigma=${finalSigma}`);
}

const artifact = {
  version: 1,
  description: 'Offline-trained neural surrogate for simulated GBM terminal log-return moments. Playback only; no financial forecast.',
  layers, target, input: demo.input, meanScale, stdScale,
  demoMoments: { mean: demo.mean, std: demo.std },
  training: {
    seed: 2031, scenarioSeedStart: 71000, scenarios: scenarios.length, samplesPerScenario: sampleCount,
    epochs, optimizer: 'full-batch Adam', loss: 'MSE of standardized terminal mean and log standard deviation',
    evaluation: 'The displayed scenario is part of the training grid; this is a visualization, not a held-out benchmark.',
  },
  final: { mu: finalMu, sigma: finalSigma, mean: finalMean, loss: checkpoints.at(-1).loss },
  checkpoints,
};
const artifactPath = new URL('../lib/monte-carlo-training.json', import.meta.url);
writeFileSync(artifactPath, `${JSON.stringify(artifact)}\n`);
console.log(JSON.stringify({ artifact: fileURLToPath(artifactPath), bytes: Buffer.byteLength(JSON.stringify(artifact)), checkpoints: checkpoints.length, initialLoss: checkpoints[0].loss, final: artifact.final }, null, 2));
