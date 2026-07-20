import { gateway, generateObject } from 'ai';
import type { GenerateFn } from './types';

export function makeGenerate(model: string): GenerateFn {
  return async ({ schema, prompt }) => {
    const { object } = await generateObject({ model: gateway(model), schema, prompt });
    return object;
  };
}
