import { z } from 'zod';

// Типы для точек данных
const dataPointSchema = z.tuple([z.number().describe('Timestamp'), z.number().describe('Value')]);

// Базовая схема для серии
const baseSeriesSchema = z.object({
  id: z.string(),
  slug: z.string(),
  type: z.string(),
});

// Схема для свечей (линейный график)
const candleSeriesSchema = baseSeriesSchema.extend({
  type: z.literal('line'),
  data: z.array(dataPointSchema),
});

// Схема для объёмов (столбчатый график)
const volumeSeriesSchema = baseSeriesSchema.extend({
  type: z.literal('bar'),
  data: z.array(dataPointSchema),
});

// Схема для технических индикаторов (пока пустая, но расширяемая)
const technicalSeriesSchema = baseSeriesSchema.extend({
  data: z.array(z.any()).optional(), // или уточните тип при необходимости
});

// Корневая схема
export const chartDataSchema = z.object({
  candles: z.array(candleSeriesSchema),
  volumes: z.array(volumeSeriesSchema),
  technicals: z.array(technicalSeriesSchema),
});

// Тип, выводимый из схемы (опционально)
export type ChartData = z.infer<typeof chartDataSchema>;
import { cache } from '../../lib/cache';

class Index {
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  getFunding = async (
    security: string,
    candles = 50,
    interval = 1,
  ): Promise<ChartData['candles'][number]['data']> => {
    const key = `moex:funding:${security}|${candles}|${interval}`;
    const cached = await cache.get<ChartData['candles'][number]['data']>(key);
    if (cached !== undefined) {
      return cached;
    }

    const response = await fetch(
      `https://iss.moex.com/cs/engines/futures/markets/swaprates/securities/${encodeURIComponent(
        security,
      )}?candles=${candles}&interval=${interval}`,
    );
    const data = chartDataSchema.parse(await response.json());
    const result = data.candles[0]?.data;

    if (!result) {
      throw new Error('Invalid data');
    }

    // Cache the result (including empty arrays) for 15 minutes
    await cache.set(key, result, this.CACHE_TTL_MS);
    return result;
  };
}

export const moexService = new Index();
