import { InjectQueue } from '@nestjs/bullmq';
import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { OkResponseDto } from '../../../dto/response';
import {
  ListQueryDto,
  ScraperCreateDto,
  ScraperDto,
  ScraperRunResponseDto,
  ScraperSchema,
  ScrapersListResponseDto,
  ScrapersListResponseSchema,
  ScraperUpdateDto,
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
  @ApiOperation({
    summary: 'List scrapers',
    description:
      'Returns a paginated list of configured scrapers ordered by name.',
  })
  @ZodResponse({ type: ScrapersListResponseDto })
  async list(@Query() q: ListQueryDto) {
    const take = q.limit;
    const skip = q.offset;
    const where = q.topicId ? { topic: { id: q.topicId } } : {};
    const [items, total] = await this.scrapers.findAndCount({
      where,
      order: { name: 'ASC' as const },
      take,
      skip,
      relations: ['topic'],
    });
    return ScrapersListResponseSchema.parse({
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        type: i.type,
        config: i.config,
        ...(i.postProcessors ? { postProcessors: i.postProcessors } : {}),
        ...(i.topic ? { topicId: i.topic.id } : {}),
      })),
      total,
      limit: take,
      offset: skip,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get scraper by ID',
    description: 'Fetch a single scraper by its UUID.',
  })
  @ZodResponse({ type: ScraperDto })
  async getOne(@Param('id') id: string) {
    const item = await this.scrapers.findOne({ where: { id }, relations: ['topic'] });
    if (!item) throw new NotFoundException('Not found');
    return {
      data: ScraperSchema.parse({
        id: item.id,
        name: item.name,
        type: item.type,
        config: item.config,
        ...(item.postProcessors ? { postProcessors: item.postProcessors } : {}),
        ...(item.topic ? { topicId: item.topic.id } : {}),
      }),
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create scraper',
    description:
      'Create a new scraper of type HTML or API with configuration and optional post-processors.',
  })
  @ZodResponse({ type: ScraperDto })
  async create(@Body() body: ScraperCreateDto) {
    const name = body.data.name.trim();
    const type = body.data.type;
    const config = body.data.config;
    const postProcessors = body.data.postProcessors;
    const entity = this.scrapers.create({ name, type, config, postProcessors });
    const created = await this.scrapers.save(entity);
    return {
      data: ScraperSchema.parse({
        id: created.id,
        name: created.name,
        type: created.type,
        config: created.config,
        ...(created.postProcessors
          ? { postProcessors: created.postProcessors }
          : {}),
      }),
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update scraper',
    description: 'Partially update scraper fields by ID.',
  })
  @ZodResponse({ type: ScraperDto })
  async update(@Param('id') id: string, @Body() body: ScraperUpdateDto) {
    const item = await this.scrapers.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    await this.scrapers.update({ id }, body.data);
    const fresh = await this.scrapers.findOne({ where: { id } });

    if (!fresh) {
      throw new InternalServerErrorException('Failed to update scraper');
    }
    return {
      data: ScraperSchema.parse({
        id: fresh.id,
        name: fresh.name,
        type: fresh.type,
        config: fresh.config,
        ...(fresh.postProcessors
          ? { postProcessors: fresh.postProcessors }
          : {}),
      }),
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete scraper',
    description: 'Delete a scraper by ID.',
  })
  @ZodResponse({ type: OkResponseDto })
  async remove(@Param('id') id: string) {
    const item = await this.scrapers.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    await this.scrapers.delete({ id });
    return { ok: true };
  }

  @Post(':id/run')
  @ApiOperation({
    summary: 'Run scraper',
    description:
      'Enqueue a background job to run the scraper. Requires Redis to be configured.',
  })
  @ZodResponse({ type: ScraperRunResponseDto })
  async run(@Param('id') id: string) {
    const item = await this.scrapers.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    const job = await this.scrapQueue.add(
      'run',
      { scraperId: id },
      { removeOnComplete: true, removeOnFail: 10 },
    );
    return { ok: true, jobId: job.id };
  }
}
