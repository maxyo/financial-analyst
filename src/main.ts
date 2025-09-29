import { TinkoffInvestApi, Helpers } from 'tinkoff-invest-api';
import { config as configDotenv } from 'dotenv';
import { CandleInterval } from 'tinkoff-invest-api/dist/generated/marketdata';

// Simple UI wiring
const write = (msg: string) => {
  console.log(msg);
};

// Load environment variables from project root .env
configDotenv();

// Main: connect to Tinkoff Invest API and compute parameters for CNYRUBF
async function main() {
  try {
    // Token handling: use ?token=... from URL or TINKOFF_TOKEN env injected by Vite define
    const envToken = (process)?.env?.TINKOFF_TOKEN;
    const token = envToken;

    if (!token) {
      write('Укажите токен Tinkoff Invest: добавьте ?token=YOUR_TOKEN к URL, либо определите Vite define TINKOFF_TOKEN.');
      return;
    }

    write('Подключение к Tinkoff Invest API...');
    const api = new TinkoffInvestApi({ token });

    // Resolve instrument by ticker CNYRUBF on MOEX (class_code may be needed)
    // Use findInstrument to be robust
    const found = await api.instruments.findInstrument({ query: 'CNYRUBF' });
    const instrument = found.instruments.find(i => i.ticker === 'CNYRUBF') || found.instruments[0];

    if (!instrument) {
      write('Инструмент CNYRUBF не найден.');
      return;
    }

    const { figi, lot, name, ticker } = instrument;

    // Fetch last price, orderbook (for bid/ask), and today candles to compute change/high/low
    const [lastPriceResp, orderBook] = await Promise.all([
      api.marketdata.getLastPrices({ figi: [], instrumentId: [figi], lastPriceType: 0 }),
      api.marketdata.getOrderBook({ instrumentId: figi, depth: 10 }),
    ]);

    const lastPrice = lastPriceResp.lastPrices?.[0]?.price ? Helpers.toNumber(lastPriceResp.lastPrices[0].price) : undefined;

    let bestBid: number | undefined;
    let bestAsk: number | undefined;
    if (orderBook) {
      bestBid = orderBook.bids?.[0]?.price ? Helpers.toNumber(orderBook.bids[0].price) : undefined;
      bestAsk = orderBook.asks?.[0]?.price ? Helpers.toNumber(orderBook.asks[0].price) : undefined;
    }

    const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : undefined;

    // Today period in exchange time zone; use from start of day to now
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);

    let dayHigh: number | undefined;
    let dayLow: number | undefined;
    let dayOpen: number | undefined;
    let volumeSum = 0;

    try {
      const candles = await api.marketdata.getCandles({
        instrumentId: figi,
        from,
        to: now,
        interval: CandleInterval.CANDLE_INTERVAL_1_MIN, // CandleInterval.CANDLE_INTERVAL_1_MIN
      });
      if (candles?.candles?.length) {
        const hs: number[] = [];
        const ls: number[] = [];
        for (const c of candles.candles) {
          const h = Helpers.toNumber(c.high as any);
          const l = Helpers.toNumber(c.low as any);
          if (h != null) hs.push(h);
          if (l != null) ls.push(l);
          volumeSum += Number(c.volume || 0);
        }
        if (hs.length) dayHigh = Math.max(...hs);
        if (ls.length) dayLow = Math.min(...ls);
        const first = candles.candles[0];
        dayOpen = first ? Helpers.toNumber(first.open as any) : undefined;
      }
    } catch (e) {
      console.warn('Ошибка загрузки свечей:', e);
    }

    const changeAbs = lastPrice != null && dayOpen != null ? lastPrice - dayOpen : undefined;
    const changePct = changeAbs != null && dayOpen ? (changeAbs / dayOpen) * 100 : undefined;

    // Render summary
    const lines: string[] = [];
    lines.push(`Инструмент: ${name} (${ticker}) FIGI=${figi}`);
    lines.push(`Лот: ${lot}`);
    if (lastPrice != null) lines.push(`Текущая цена: ${lastPrice}`);
    if (bestBid != null) lines.push(`Лучшая покупка (bid): ${bestBid}`);
    if (bestAsk != null) lines.push(`Лучшая продажа (ask): ${bestAsk}`);
    if (spread != null) lines.push(`Спред: ${spread}`);
    if (dayHigh != null) lines.push(`Макс за день: ${dayHigh}`);
    if (dayLow != null) lines.push(`Мин за день: ${dayLow}`);
    if (changeAbs != null && changePct != null) lines.push(`Изменение за день: ${changeAbs.toFixed(4)} (${changePct.toFixed(2)}%)`);
    if (volumeSum) lines.push(`Суммарный объем (1m свечи с начала дня): ${volumeSum}`);

    write(lines.join('\n'));
  } catch (err) {
    console.error(err);
    write('Ошибка при работе с Tinkoff Invest API. Подробнее в консоли.');
  }
}

void main();
