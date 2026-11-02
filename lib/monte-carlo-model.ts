import training from './monte-carlo-training.json' with { type: 'json' };

export const TARGET = { mu: training.target.mu, sigma: training.target.sigma };
export const MODEL_LAYERS: readonly number[] = training.layers;
export const TRAINING_CHECKPOINTS = training.checkpoints;

export type ModelState = {
  mu: number;
  sigma: number;
  /** Current displayed-scenario MSE in the model's normalized output space. */
  loss: number;
  /** Layer → output node → input node. */
  weights: number[][][];
  /** The input followed by each actual layer's activations. */
  activations: number[][];
};

/** Replay saved real weights; no training or data requests run in the browser. */
export function modelState(progress: number): ModelState {
  const finiteProgress = Number.isFinite(progress) ? progress : 0;
  const position = Math.max(0, Math.min(1, finiteProgress)) * (TRAINING_CHECKPOINTS.length - 1);
  const leftIndex = Math.min(TRAINING_CHECKPOINTS.length - 2, Math.floor(position));
  const left = TRAINING_CHECKPOINTS[leftIndex];
  const right = TRAINING_CHECKPOINTS[leftIndex + 1];
  const fraction = position - leftIndex;
  const mix = (a: number, b: number) => a + (b - a) * fraction;
  const weights = left.weights.map((layer, l) => layer.map((row, j) => row.map((weight, k) => mix(weight, right.weights[l][j][k]))));
  const biases = left.biases.map((layer, l) => layer.map((bias, j) => mix(bias, right.biases[l][j])));
  const activations: number[][] = [[...training.input]];
  for (let l = 0; l < weights.length; l++) {
    const previous = activations[l];
    activations.push(weights[l].map((row, j) => {
      const sum = biases[l][j] + row.reduce((value, weight, k) => value + weight * previous[k], 0);
      return l === weights.length - 1 ? sum : Math.tanh(sum);
    }));
  }
  const output = activations[activations.length - 1];
  const mean = output[0] * training.meanScale;
  const sigma = Math.exp(output[1]) * training.stdScale;
  const expected = [training.demoMoments.mean / training.meanScale, Math.log(training.demoMoments.std / training.stdScale)];
  const loss = output.reduce((sum, value, j) => sum + (value - expected[j]) ** 2, 0) / output.length;
  return { mu: mean + 0.5 * sigma ** 2, sigma, loss, weights, activations };
}
