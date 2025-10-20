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
import { applyFilter } from '@trade/filter';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';

import { OkResponseDto } from '../../../../../dto/response';
import { CollectionsRepository } from '../../../repositories/collections.repository';
import {
  type CollectionCreateDto,
  type CollectionDocumentsQueryDto,
  CollectionDto,
  CollectionSchema,
  type CollectionsListQueryDto,
  CollectionsListResponseDto,
  CollectionsListResponseSchema,
  type CollectionUpdateDto,
  DocumentSchema,
} from '../dto/collection.dto';
import { DocumentsRepository } from '../repositories/documents.repository';

@ApiTags('Collections')
@Controller('api/collections')
export class CollectionController {
  constructor(
    private readonly collections: CollectionsRepository,
    private readonly docsRepo: DocumentsRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List collections', description: 'Returns a paginated list of collections, optionally filtered by name (q). Ordered by created_at DESC.' })
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
  @ApiOperation({ summary: 'Get collection by ID', description: 'Fetch a single collection by its UUID.' })
  @ZodResponse({ type: CollectionDto })
  async getOne(@Param('id') id: string) {
    const item = await this.collections.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Collection not found');
    return CollectionSchema.parse(item);
  }

  @Post()
  @ApiOperation({ summary: 'Create collection', description: 'Create a new collection with name, optional description, and optional filter definition.' })
  @ZodResponse({ type: CollectionDto })
  async create(@Body() body: CollectionCreateDto) {
    const entity = this.collections.create(body);

    return CollectionSchema.parse(await this.collections.save(entity));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update collection', description: 'Partially update a collection by UUID.' })
  @ZodResponse({ type: CollectionDto })
  async update(@Param('id') id: string, @Body() body: CollectionUpdateDto) {
    const item = await this.collections.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Collection not found');
    await this.collections.update({ id }, body);

    const result = await this.collections.findOne({ where: { id } });
    if (!result) {
      throw new InternalServerErrorException('Failed to update collection');
    }

    return CollectionSchema.parse(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete collection', description: 'Delete a collection by UUID.' })
  @ZodResponse({ type: OkResponseDto })
  async remove(@Param('id') id: string) {
    const item = await this.collections.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Collection not found');
    await this.collections.delete({ id });
    return { ok: true };
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'List documents in collection', description: 'Returns documents that match the collection filters with pagination (ordered by scraped_at DESC).' })
  @ZodResponse({ type: createZodDto(z.array(DocumentSchema)) })
  async documents(
    @Param('id') id: string,
    @Query() q: CollectionDocumentsQueryDto,
  ) {
    const collection = await this.collections.findOne({
      where: { id },
    });
    if (!collection) {
      throw new NotFoundException(`Collection with id ${id} not found`);
    }

    const take = q.limit;
    const skip = q.offset;

    const qb = this.docsRepo.createQueryBuilder('d');
    applyFilter(qb, 'd', collection.filters);

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
