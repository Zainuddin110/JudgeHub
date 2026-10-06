import { z } from "zod";

export interface CriterionTypePlugin<TConfig = unknown, TValue = unknown> {
  id: string;
  name: string;
  description: string;
  configSchema: z.ZodType<TConfig>;
  valueSchema: z.ZodType<TValue>;
  normalizeToUnit: (value: TValue, config: TConfig) => number | null;
}

export interface ScoringMethodPlugin<TConfig = unknown> {
  id: string;
  name: string;
  description: string;
  configSchema: z.ZodType<TConfig>;
  aggregate: (judgeScores: number[], config: TConfig) => number;
}

export interface AssignmentStrategyPlugin<TConfig = unknown> {
  id: string;
  name: string;
  description: string;
  configSchema: z.ZodType<TConfig>;
}

export interface FormFieldTypePlugin<TConfig = unknown> {
  id: string;
  name: string;
  description: string;
  configSchema: z.ZodType<TConfig>;
}

export class Registry<T extends { id: string }> {
  private items = new Map<string, T>();

  register(item: T): void {
    if (this.items.has(item.id)) {
      throw new Error(`Plugin with id "${item.id}" is already registered`);
    }
    this.items.set(item.id, item);
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  list(): T[] {
    return Array.from(this.items.values());
  }
}

export const criterionTypesRegistry = new Registry<CriterionTypePlugin>();
export const scoringMethodsRegistry = new Registry<ScoringMethodPlugin>();
export const assignmentStrategiesRegistry = new Registry<AssignmentStrategyPlugin>();
export const formFieldTypesRegistry = new Registry<FormFieldTypePlugin>();
