import { getApi, InstrumentIdType } from '../api/tinkoff';

class Instrument {
  async getBaseInstrument(derivativeInstrumentUid: string) {
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
        classCode: (instrument).classCode || '',
        id: instrument.ticker,
      });
      const fut =
        (futureResp)?.instrument;
      const posUid = fut?.basicAssetPositionUid;
      if (!posUid) return null;

      const instrResp = await api.instruments.getInstrumentBy({
        idType: InstrumentIdType.INSTRUMENT_ID_TYPE_POSITION_UID,
        id: posUid,
      });

      return instrResp.instrument;

    } catch {
      return null;
    }
  }
}
export const instrumentService = new Instrument();
