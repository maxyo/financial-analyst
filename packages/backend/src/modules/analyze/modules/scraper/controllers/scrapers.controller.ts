import { InjectQueue } from '@nestjs/bullmq';
import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { OkResponseDto } from '../../../../../dto/response';
import {
  ListQueryDto,
  ScraperCreateDto,
  ScraperUpdateDto,
  ScraperDto,
  ScrapersListResponseDto,
  ScraperRunResponseDto,
  ScrapersListResponseSchema,
  ScraperSchema,
} from '../dto/scrapers.dto';
import { ScrapersRepository } from '../repositories/scrapers.repository';

import type { Queue } from 'bullmq';

@ApiTags('Scrapers')
@Controller('api/scrapers')
export class ScrapersController {
  constructor(
    private readonly scrapers: ScrapersRepository,
    @InjectQueue('scrap.run') private readonly scrapQueue: Queue,
  ) {}

  @Get()
  @ZodResponse({ type: ScrapersListResponseDto })
  async list(@Query() q: ListQueryDto) {
    const take = q.limit;
    const skip = q.offset;
    const [items, total] = await this.scrapers.findAndCount({
      order: { name: 'ASC' as const },
      take,
      skip,
    });
    return ScrapersListResponseSchema.parse({ items: items.map(i => ({data: i})), total, limit: take, offset: skip });
  }

  @Get(':id')
  @ZodResponse({ type: ScraperDto })
  async getOne(@Param('id') id: string) {
    const item = await this.scrapers.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    return ScraperSchema.parse(item);
  }

  @Post()
  @ZodResponse({ type: ScraperDto })
  async create(@Body() body: ScraperCreateDto) {
    const name = body.data.name.trim();
    const type = body.data.type;
    const config = body.data.config;
    const postProcessors = (body).data.postProcessors;
    const entity = this.scrapers.create({ name, type, config, postProcessors });
    const created = await this.scrapers.save(entity);
    return ScraperSchema.parse(created);
  }

  @Patch(':id')
  @ZodResponse({ type: ScraperDto })
  async update(@Param('id') id: string, @Body() body: ScraperUpdateDto) {
    const item = await this.scrapers.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    await this.scrapers.update({ id }, body.data);
    const fresh = await this.scrapers.findOne({ where: { id } });
    return ScraperSchema.parse(fresh);
  }

  @Delete(':id')
  @ZodResponse({ type: OkResponseDto })
  async remove(@Param('id') id: string) {
    const item = await this.scrapers.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    await this.scrapers.delete({ id });
    return { ok: true };
  }

  @Post(':id/run')
  @ZodResponse({ type: ScraperRunResponseDto })
  async run(@Param('id') id: string) {
    const item = await this.scrapers.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    const job = await this.scrapQueue.add('run', { scraperId: id }, { removeOnComplete: true, removeOnFail: 10 });
    return { ok: true, jobId: job.id };
  }
}
