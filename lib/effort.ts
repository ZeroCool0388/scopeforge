import model from '@/data/effort-model.json';
import { EffortInputSchema, type Scope, type ScopeContent } from './schema';
export function estimateEffort(input: ScopeContent['effort']): Scope['effort'] {
  const clean = EffortInputSchema.parse(input);
  const drivers = clean.drivers.filter(
    (d, i, all) => all.findIndex((x) => x.id === d.id) === i,
  );
  const [baseMin, baseMax] = model.base[clean.size];
  return {
    size: clean.size,
    drivers,
    min: drivers.reduce((n, d) => n + model.drivers[d.id][0], baseMin),
    max: drivers.reduce((n, d) => n + model.drivers[d.id][1], baseMax),
  };
}
