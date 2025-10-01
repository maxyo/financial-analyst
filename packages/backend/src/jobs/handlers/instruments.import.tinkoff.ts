import { JobsProcessor } from '../../modules/jobs/processor';
import { listInstruments, type InstrumentCategory } from '../../modules/market-prodivers/tinkoff/instruments';
import { getRepositories } from '../../repositories';

export default function registerInstrumentsImportTinkoff(jobsProcessor: JobsProcessor) {
  jobsProcessor.register('instruments.import.tinkoff', async (job) => {
    const repos = getRepositories();
    const payload: any = job.payload || {};

    // Normalize categories (types) from payload
    const rawTypes: any = payload.types || payload.categories || payload.kinds;
    const allowed: InstrumentCategory[] = ['shares', 'futures', 'bonds', 'etfs', 'currencies'];
    let categories: InstrumentCategory[] | undefined = undefined;
    if (Array.isArray(rawTypes)) {
      const norm = rawTypes.map((x) => String(x).toLowerCase().trim());
      categories = allowed.filter((k) => norm.includes(k));
      if (categories.length === 0) categories = undefined;
    } else if (typeof rawTypes === 'string' && rawTypes.trim()) {
      const norm = rawTypes
        .split(/[,\s]+/)
        .map((s: string) => s.toLowerCase().trim())
        .filter(Boolean);
      categories = allowed.filter((k) => norm.includes(k));
      if (categories.length === 0) categories = undefined;
    }

    const dryRun = Boolean(payload.dryRun || payload.dry_run);

    const rows = await listInstruments(categories);
    let upserts = 0;

    if (!dryRun) {
      for (const r of rows) {
        // Skip invalid ticker rows just in case
        if (!r.ticker) continue;
        repos.instruments.upsert(r);
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
  });
}
