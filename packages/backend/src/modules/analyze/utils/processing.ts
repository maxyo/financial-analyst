import { Scraper } from '../entities/scrapper.entity';
import {
  PostProcessorConfiguration,
  PostProcessorType,
  TrimWhitespaceConfig,
} from '../types';

export type ProcessableDoc = { title: string; content: string };

function applyTrimWhitespace(
  input: ProcessableDoc,
  cfg: TrimWhitespaceConfig,
): ProcessableDoc {
  const collapseMultipleSpaces = cfg.collapseMultipleSpaces ?? true;
  const collapseNewlines = cfg.collapseNewlines ?? true;
  const trimEachLine = cfg.trimEachLine ?? true;

  const processTitle = (s: string) => {
    let t = s ?? '';
    t = t.trim();
    if (collapseMultipleSpaces) t = t.replace(/[ \t]{2,}/g, ' ');
    return t;
  };

  const processContent = (s: string) => {
    let t = s ?? '';
    // normalize newlines to \n
    t = t.replace(/\r\n?/g, '\n');
    if (trimEachLine) {
      t = t
        .split('\n')
        .map((line) => line.trim())
        .join('\n');
    } else {
      t = t.trim();
    }
    if (collapseMultipleSpaces) t = t.replace(/[ \t]{2,}/g, ' ');
    if (collapseNewlines) t = t.replace(/\n{2,}/g, '\n');
    return t;
  };

  return {
    title: processTitle(input.title),
    content: processContent(input.content),
  };
}

function applyOne(doc: ProcessableDoc, pp: { type: PostProcessorType; config: PostProcessorConfiguration[PostProcessorType]}): ProcessableDoc {
  switch (pp.type) {
    case PostProcessorType.TRIM_WHITESPACE:
      return applyTrimWhitespace(doc, pp.config as TrimWhitespaceConfig);
    default:
      return doc;
  }
}

export function applyPostProcessors(
  scraper: Scraper,
  doc: ProcessableDoc,
): ProcessableDoc {
  const list = (scraper.postProcessors ?? []) as { type: PostProcessorType; config: PostProcessorConfiguration[PostProcessorType] }[];
  if (!list.length) return doc;
  return list.reduce((acc, pp) => applyOne(acc, pp), doc);
}
