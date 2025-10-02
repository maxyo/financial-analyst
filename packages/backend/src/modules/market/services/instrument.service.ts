import { Injectable } from '@nestjs/common';

import {
  InstrumentIdType,
  TinkoffApiService,
} from '../modules/tinkoff/tinkoff.service';

@Injectable()
export class InstrumentNestService {
  constructor(private readonly tinkoff: TinkoffApiService) {}

  /**
   * Find the first matching instrument by free-text query via Tinkoff API.
   */
  async findInstrument(query: string) {
    const q = String(query || '').trim();
    if (!q) return undefined;
    const res = await this.tinkoff.findInstrument(q);
    return res.instruments[0];
  }

  /**
   * Resolve the base instrument for a derivative (e.g., future) by its instrument UID.
   */
  async getBaseInstrument(derivativeInstrumentUid: string) {
    const uid = String(derivativeInstrumentUid || '').trim();
    if (!uid) return null;
    const { instrument } = await this.tinkoff.getInstrumentBy({
      id: uid,
      idType: InstrumentIdType.INSTRUMENT_ID_TYPE_UID,
    });
    if (!instrument) return null;

    try {
      const futureResp = await this.tinkoff.futureBy({
        idType: InstrumentIdType.INSTRUMENT_ID_TYPE_TICKER,
        classCode: instrument.classCode || '',
        id: instrument.ticker,
      });
      const fut = (futureResp as any)?.instrument;
      const posUid = fut?.basicAssetPositionUid;
      if (!posUid) return null;

      const instrResp = await this.tinkoff.getInstrumentBy({
        idType: InstrumentIdType.INSTRUMENT_ID_TYPE_POSITION_UID,
        id: posUid,
      });

      return instrResp.instrument;
    } catch {
      return null;
    }
  }
}
