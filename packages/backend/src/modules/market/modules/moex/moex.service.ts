import { Injectable } from '@nestjs/common';
import { z } from 'zod';

// Типы и схему оставляем и переносим в Nest-сервис
// Типы для точек данных
const dataPointSchema = z.tuple([
  z.number().describe('Timestamp'),
  z.number().describe('Value'),
]);

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

// Схема для технических индикаторов (расширяемая)
const technicalSeriesSchema = baseSeriesSchema.extend({
  data: z.array(z.any()).optional(),
});

// Корневая схема
export const chartDataSchema = z.object({
  candles: z.array(candleSeriesSchema),
  volumes: z.array(volumeSeriesSchema),
  technicals: z.array(technicalSeriesSchema),
});

// Тип, выводимый из схемы
export type ChartData = z.infer<typeof chartDataSchema>;

type CacheEntry<T> = { value: T; expiresAt: number };

@Injectable()
export class MoexService {
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 минут
  private cache = new Map<string, CacheEntry<ChartData['candles'][number]['data']>>();

  /**
   * Получение данных funding c MOEX ISS API
   * @param security тикер/инструмент (например, SBRF-12.25)
   * @param candles кол-во точек (по умолчанию 50)
   * @param interval интервал (по умолчанию 1)
   */
  async getFunding(
    security: string,
    candles = 50,
    interval = 1,
  ): Promise<ChartData['candles'][number]['data']> {
    const key = `moex:funding:${security}|${candles}|${interval}`;
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > now) {
      return hit.value;
    }

    const response = await fetch(
      `https://iss.moex.com/cs/engines/futures/markets/swaprates/securities/${encodeURIComponent(
        security,
      )}?candles=${candles}&interval=${interval}`,
    );

    if (!response.ok) {
      throw new Error(`MOEX request failed: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const data = chartDataSchema.parse(json);
    const result = data.candles[0]?.data;

    if (!result) {
      throw new Error('Invalid MOEX data format: empty candles');
    }

    // Кэшируем результат на 15 минут
    this.cache.set(key, { value: result, expiresAt: now + this.CACHE_TTL_MS });
    return result;
  }
}
