// Thin API adapter that maps UI needs to generated OpenAPI client services
// This lets us keep the existing UI data shapes while switching from mocks to backend.

import {
  DocumentsService,
  ProfilesService,
  ReportsService,
  ScrapersService,
  TasksService,
  TopicsService,
  type DocumentsListResponseDto_Output,
  type ProfilesListResponseDto_Output,
  type ReportsListResponseDto_Output,
  type ScrapersListResponseDto_Output,
  type TasksListResponseDtoClass_Output,
  type TopicDtoClass_Output,
  type ProfileDto_Output,
  type TaskDtoClass_Output,
  type ScraperDto_Output,
  type DocumentDto_Output,
} from './client';

// Local UI types
import type { Document, Profile, Report, Scraper, Task, Topic } from '../lib/types';

// Mappers from API DTOs to UI types where naming differs

function mapTopic(t: TopicDtoClass_Output): Topic {
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? null,
    parent_id: t.parent_id ?? null,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

function mapProfile(p: ProfileDto_Output): Profile {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    topic_id: (p as any).topic_id ?? null, // backend exposes topic_id in DTO
    task_id: (p as any).task_id ?? null, // use dedicated task API for strictness if needed
    created_at: (p as any).created_at ?? '',
    updated_at: (p as any).updated_at ?? '',
  };
}

function mapTask(t: TaskDtoClass_Output): Task {
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? null,
    prompt: t.prompt,
  } as Task & { created_at?: string; updated_at?: string }; // created_at/updated_at may not be in DTO
}

function mapScraper(s: ScraperDto_Output): Scraper {
  return {
    id: s.id,
    name: s.name,
    type: s.type as Scraper['type'],
    config: s.config as any,
    topicId: (s as any).topicId ?? null,
    postProcessors: (s as any).postProcessors,
  };
}

function mapDocument(d: DocumentDto_Output): Document {
  return {
    id: d.id,
    title: d.title,
    content: d.content,
    scraper: {
      id: d.scraper.id,
      name: d.scraper.name,
    },
    scrapedAt: d.scrapedAt,
    date: d.date,
    meta: (d.meta ?? {}) as any,
    type: d.type as any,
    contentHash: d.contentHash,
  };
}

function mapReport(r: ReportsListResponseDto_Output['items'][number] | any): Report {
  return {
    id: r.id,
    profile_id: r.profile_id ?? null,
    type: r.type ?? null,
    content: r.content ?? null,
    llmModel: (r as any).llmModel ?? null,
    created_at: r.created_at ?? '',
    tokens_in: r.tokens_in ?? null,
    tokens_out: r.tokens_out ?? null,
    cost: r.cost ?? null,
  };
}

export const api = {
  // Topics
  async getTopics() {
    const res = await TopicsService.topicsControllerList(50);
    return {
      items: res.items.map(mapTopic),
      total: res.total,
      limit: res.limit,
      offset: res.offset,
    };
  },
  async getTopic(id: number) {
    const t = await TopicsService.topicsControllerGetOne(String(id));
    return mapTopic(t);
  },

  // Profiles
  async getProfiles(params?: { topic_id?: number }) {
    // Backend list does not filter by topic in this route; consumers usually filter client-side or use separate endpoint.
    const res: ProfilesListResponseDto_Output = await ProfilesService.profileControllerList(50);
    let items = res.items.map(mapProfile);
    if (params?.topic_id != null) {
      items = items.filter(p => p.topic_id === params.topic_id);
    }
    return {
      items,
      total: items.length,
      limit: 50,
      offset: 0,
    };
  },
  async getProfile(id: number) {
    const p = await ProfilesService.profileControllerGetOne(String(id));
    // Also try get task id via dedicated API if not present
    try {
      const t = await ProfilesService.profileControllerGetTask(String(id));
      (p as any).task_id = t.task_id ?? null;
    } catch {}
    return mapProfile(p);
  },
  async createProfile(data: Partial<Profile>) {
    const created = await ProfilesService.profileControllerCreate({
      name: data.name || '',
      description: data.description ?? null,
      topic_id: (data.topic_id ?? null) as any,
    });
    // Assign task if provided
    if (data.task_id != null) {
      await ProfilesService.profileControllerAssignTask(String(created.id), {
        task_id: data.task_id,
      });
    }
    return mapProfile(created);
  },
  async updateProfile(id: number, data: Partial<Profile>) {
    const updated = await ProfilesService.profileControllerUpdate(String(id), {
      name: data.name,
      description: data.description,
    });
    if (data.task_id === null) {
      await ProfilesService.profileControllerUnassignTask(String(id));
    } else if (typeof data.task_id === 'number') {
      await ProfilesService.profileControllerAssignTask(String(id), {
        task_id: data.task_id,
      });
    }
    return mapProfile(updated);
  },
  async runProfile(id: number) {
    return ProfilesService.profileControllerRunAggregate(String(id));
  },

  // Tasks
  async getTasks() {
    const res: TasksListResponseDtoClass_Output = await TasksService.tasksControllerList(50);
    return {
      items: res.items.map(mapTask),
      total: res.total,
      limit: res.limit,
      offset: res.offset,
    };
  },
  async getTask(id: number) {
    const t = await TasksService.tasksControllerGetOne(String(id));
    return mapTask(t);
  },
  async createTask(data: Partial<Task>) {
    const t = await TasksService.tasksControllerCreate({
      name: data.name || '',
      description: data.description ?? null,
      prompt: data.prompt || '',
    });
    return mapTask(t);
  },
  async updateTask(id: number, data: Partial<Task>) {
    const t = await TasksService.tasksControllerUpdate(String(id), {
      name: data.name,
      description: data.description,
      prompt: data.prompt,
    });
    return mapTask(t);
  },

  // Scrapers
  async getScrapers(_params?: { topicId?: number }) {
    const res: ScrapersListResponseDto_Output = await ScrapersService.scrapersControllerList(50);
    return {
      items: res.items.map(mapScraper),
      total: res.total,
      limit: res.limit,
      offset: res.offset,
    };
  },
  async getScraper(id: string) {
    const s = await ScrapersService.scrapersControllerGetOne(id);
    return mapScraper(s);
  },
  async createScraper(data: Partial<Scraper>) {
    const s = await ScrapersService.scrapersControllerCreate({
      name: data.name || '',
      type: (data.type as any) || 'HTML',
      config: (data as any).config || {},
      topicId: (data as any).topicId ?? null,
      postProcessors: (data as any).postProcessors,
    });
    return mapScraper(s);
  },
  async updateScraper(id: string, data: Partial<Scraper>) {
    const s = await ScrapersService.scrapersControllerUpdate(id, {
      name: data.name,
      type: data.type as any,
      config: (data as any).config,
      topicId: (data as any).topicId,
      postProcessors: (data as any).postProcessors,
    });
    return mapScraper(s);
  },
  async runScraper(id: string) {
    return ScrapersService.scrapersControllerRun(id);
  },

  // Documents
  async getDocuments() {
    const res: DocumentsListResponseDto_Output = await DocumentsService.documentsControllerList(50);
    return {
      items: res.items.map(mapDocument),
      total: res.total,
      limit: res.limit,
      offset: res.offset,
    };
  },

  // Reports
  async getReports(params?: { profile_id?: number }) {
    const res: ReportsListResponseDto_Output = await ReportsService.reportControllerList(
      50,
      0,
      params?.profile_id,
    );
    return {
      items: res.items.map(mapReport),
      total: res.total,
      limit: res.limit,
      offset: res.offset,
    };
  },
};

export type Api = typeof api;
