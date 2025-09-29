import { getApi } from '../api';

class Instrument {
  async getBaseInstrument(derivativeInstrumentUid: string) {
    const { InstrumentIdType } = await import(
      'tinkoff-invest-api/dist/generated/instruments.js'
    );
    const api = getApi();
    // Resolve instrument to get classCode for futureBy
    const { instrument } = await api.instruments.getInstrumentBy({
      id: derivativeInstrumentUid,
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_UID,
    });
    if (!instrument) return null;

    try {
      const futureResp = await api.instruments.futureBy({
        idType: InstrumentIdType.INSTRUMENT_ID_TYPE_TICKER,
        classCode: (instrument as any).classCode || '',
        id: instrument.ticker,
      } as any);
      const fut =
        (futureResp as any)?.instrument ||
        (futureResp as any)?.future ||
        (futureResp as any);
      const posUid = fut?.basicAssetPositionUid;
      if (!posUid) return null;

      const instrResp = await api.instruments.getInstrumentBy({
        idType: InstrumentIdType.INSTRUMENT_ID_TYPE_POSITION_UID,
        id: posUid,
      } as any);

      return instrResp.instrument;

    } catch {
      return null;
    }
  }
}
export const instrumentService = new Instrument();
