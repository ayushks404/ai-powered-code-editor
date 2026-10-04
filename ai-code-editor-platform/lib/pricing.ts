/**
 * Model pricing constants (per 1,000,000 tokens)
 * OpenAI gpt-4o-mini: $0.15 / 1M input, $0.60 / 1M output
 * Anthropic claude-3-5-sonnet / sonnet-4-6: $3.00 / 1M input, $15.00 / 1M output
 */

export const MODEL_PRICING = {
  completion: {
    model: 'gpt-4o-mini',
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
  },
  review: {
    model: 'claude-sonnet-4-6',
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
  },
};

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  type: 'completion' | 'review'
): number {
  const rates = MODEL_PRICING[type];
  const inputCost = (inputTokens / 1_000_000) * rates.inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * rates.outputCostPerMillion;
  return inputCost + outputCost;
}
