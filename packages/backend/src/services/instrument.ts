import { getApi, InstrumentIdType } from '../api/tinkoff';

class InstrumentService {
  /**
   * Find the first matching instrument by free-text query via Tinkoff API.
   * @param query Free-text search query (ticker, name, etc.)
   * @returns First found instrument or undefined if nothing matches
   */
  async findInstrument(query: string) {
    const api = getApi();
    const q = String(query || '').trim();
    if (!q) return undefined;
    const res = await api.instruments.findInstrument({ query: q });
    return res.instruments[0];
  }

  /**
   * Resolve the base instrument for a derivative (e.g., future) by its instrument UID.
   * Uses instruments.getInstrumentBy to read classCode, then instruments.futureBy to locate
   * the future descriptor and its basicAssetPositionUid, and finally resolves the base
   * instrument by POSITION_UID.
   *
   * @param derivativeInstrumentUid The derivative instrument UID
   * @returns Base instrument object or null if it cannot be resolved
   */
  async getBaseInstrument(derivativeInstrumentUid: string) {
    const api = getApi();
    const uid = String(derivativeInstrumentUid || '').trim();
    if (!uid) return null;
    // Resolve instrument to get classCode for futureBy
    const { instrument } = await api.instruments.getInstrumentBy({
      id: uid,
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_UID,
    });
    if (!instrument) return null;

    try {
      const futureResp = await api.instruments.futureBy({
        idType: InstrumentIdType.INSTRUMENT_ID_TYPE_TICKER,
        classCode: instrument.classCode || '',
        id: instrument.ticker,
      });
      const fut = futureResp?.instrument;
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
export const instrumentService = new InstrumentService();
