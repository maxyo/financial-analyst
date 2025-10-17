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
import { ApiTags } from '@nestjs/swagger';
import {applyFilter} from '@trade/filter';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';

import { OkResponseDto } from '../../../common/zod-response';
import {
  type CollectionCreateDto,
  type CollectionDocumentsQueryDto,
  CollectionDto,
  type CollectionFilters,
  CollectionSchema,
  type CollectionsListQueryDto,
  CollectionsListResponseDto, CollectionsListResponseSchema,
  type CollectionUpdateDto,
  DocumentSchema,
} from '../dto/collection.dto';
import { DocumentsRepository } from '../modules/scraper/repositories/documents.repository';
import { CollectionsRepository } from '../repositories/collections.repository';

@ApiTags('Collections')
@Controller('api/collections')
export class CollectionController {
  constructor(
    private readonly collections: CollectionsRepository,
    private readonly docsRepo: DocumentsRepository,
  ) {}

  @Get()
  @ZodResponse({ type: CollectionsListResponseDto })
  async list(@Query() q: CollectionsListQueryDto) {
    const take = q.limit;
    const skip = q.offset;
    const qb = this.collections.createQueryBuilder('c');
    if (q.q && q.q.trim()) {
      qb.where('LOWER(c.name) LIKE :q', {
        q: `%${q.q.toLowerCase()}%`,
      });
    }
    qb.orderBy('c.created_at', 'DESC').take(take).skip(skip);
    const [items, total] = await qb.getManyAndCount();
    return CollectionsListResponseSchema.parse({
      items,
      total,
      limit: take,
      offset: skip,
    });
  }

  @Get(':id')
  @ZodResponse({ type: CollectionDto })
  async getOne(@Param('id') id: string) {
    const item = await this.collections.findOne({ where: { id }});
    if (!item) throw new NotFoundException('Collection not found');
    return CollectionSchema.parse(item);
  }

  @Post()
  @ZodResponse({ type: CollectionDto })
  async create(@Body() body: CollectionCreateDto) {
    const now = new Date();
    const entity = this.collections.create({
      name: body.name.trim(),
      description: body.description ?? null,
      filters: body.filters == null ? null : JSON.stringify(body.filters),
      created_at: now,
      updated_at: now,
    });

    return CollectionSchema.parse(await this.collections.save(entity));
  }

  @Patch(':id')
  @ZodResponse({ type: CollectionDto })
  async update(@Param('id') id: string, @Body() body: CollectionUpdateDto) {
    const item = await this.collections.findOne({ where: { id }});
    if (!item) throw new NotFoundException('Collection not found');
    await this.collections.update({ id }, body);

    const result = await this.collections.findOne({ where: { id }});
    if (!result) {
      throw new InternalServerErrorException('Failed to update collection');
    }

    return CollectionSchema.parse(result);
  }

  @Delete(':id')
  @ZodResponse({ type: OkResponseDto })
  async remove(@Param('id') id: string) {
    const item = await this.collections.findOne({ where: { id }});
    if (!item) throw new NotFoundException('Collection not found');
    await this.collections.delete({ id } as any);
    return { ok: true };
  }

  @Get(':id/documents')
  @ZodResponse({ type: createZodDto(z.array(DocumentSchema)) })
  async documents(
    @Param('id') id: string,
    @Query() q: CollectionDocumentsQueryDto,
  ) {
    const collection = await this.collections.findOne({
      where: { id } as any,
    });
    if (!collection) {
      throw new NotFoundException(`Collection with id ${id} not found`);
    }

    let filters: CollectionFilters | null = collection.filters
      ? JSON.parse(collection.filters)
      : null;

    const take = q.limit;
    const skip = q.offset;

    const qb = this.docsRepo.createQueryBuilder('d');
    if (filters && typeof filters === 'object') {
      applyFilter(qb, 'd', filters as any);
    }

    qb.orderBy('d.scraped_at', 'DESC').take(take).skip(skip);
    const items = await qb.getMany();

    return items.map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      scraperId: d.scraperId,
      contentHash: d.contentHash,
      scrapedAt: d.scrapedAt.toISOString(),
    }));
  }
}
