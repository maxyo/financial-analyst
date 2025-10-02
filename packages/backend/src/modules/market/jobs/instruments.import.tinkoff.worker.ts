import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';

import {
  InstrumentCategory,
  TinkoffApiService,
} from '../modules/tinkoff/tinkoff.service';
import { InstrumentsRepository } from '../repositories/instruments.repository';

import type { Job } from 'bullmq';

@Injectable()
@Processor('instruments.import.tinkoff')
export class InstrumentsImportTinkoffWorker extends WorkerHost {
  constructor(
    private readonly tinkoff: TinkoffApiService,
    private readonly instrumentsRepository: InstrumentsRepository,
  ) {
    super();
  }

  async process(job: Job) {
    const payload: any = job.data || {};
    const rawTypes: any = payload.types || payload.categories || payload.kinds;
    const allowed: InstrumentCategory[] = [
      'shares',
      'futures',
      'bonds',
      'etfs',
      'currencies',
    ];
    let categories: InstrumentCategory[] | undefined = undefined;
    if (Array.isArray(rawTypes)) {
      const norm = rawTypes.map((x: any) => String(x).toLowerCase().trim());
      categories = allowed.filter((k) => norm.includes(k));
      if (categories.length === 0) categories = undefined;
    } else if (typeof rawTypes === 'string' && rawTypes.trim()) {
      const norm = rawTypes
        .split(/[\s,]+/)
        .map((s: string) => s.toLowerCase().trim())
        .filter(Boolean);
      categories = allowed.filter((k) => norm.includes(k));
      if (categories.length === 0) categories = undefined;
    }
    const dryRun = Boolean(payload.dryRun || payload.dry_run);
    const rows = await this.tinkoff.listInstruments(categories);
    let upserts = 0;
    if (!dryRun) {
      for (const r of rows) {
        if (!r.ticker) continue;
        await this.instrumentsRepository.upsert(r, {upsertType: 'merge-into', conflictPaths: ['id']});
        upserts++;
      }
    }
    return {
      provider: 'tinkoff',
      categories: categories ?? allowed,
      dryRun,
      fetched: rows.length,
      upserted: dryRun ? 0 : upserts,
    };
  }
}
