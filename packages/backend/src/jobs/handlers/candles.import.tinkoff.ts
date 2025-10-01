import { JobsProcessor } from '../../modules/jobs';
import { CandleInterval, getApi } from '../../modules/market-prodivers/tinkoff';

export default function registerCandlesImportTinkoff(
  jobsProcessor: JobsProcessor,
) {
  jobsProcessor.register('candles.import.tinkoff', async (job) => {
    const payload = job.payload;
    const api = getApi();
    const { windowStart, windowEnd, ticker, interval, instrumentId } = payload;

    const candlesS = await api.marketdata.getCandles({
      instrumentId: instrumentId,
      from: windowStart,
      to: windowEnd,
      interval: CandleInterval.CANDLE_INTERVAL_1_MIN,
    });
  });
}
