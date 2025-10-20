import { createHash } from 'node:crypto';

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
  Query
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { In } from 'typeorm';

import { OkResponseDto } from '../../../../../dto/response';
import {
  DocumentCreateDto,
  DocumentDto,
  DocumentSchema,
  DocumentsListQueryDto,
  DocumentsListResponseDto,
  DocumentUpdateDto
} from '../dto/documents.dto';
import { DocumentEntity } from '../entities/document.entity';
import { DocumentsRepository } from '../repositories/documents.repository';
import { ScrapersRepository } from '../repositories/scrapers.repository';

function sha256Hex(s: string): string {
  const h = createHash('sha256');
  h.update(s);
  return h.digest('hex');
}

@ApiTags('Documents')
@Controller('api/documents')
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsRepository,
    private readonly scrapers: ScrapersRepository,
  ) {}

  private async mapWithScrapers<T extends DocumentEntity[] | DocumentEntity>(
    items: T,
  ): Promise<T extends DocumentEntity[] ? DocumentDto[] : DocumentDto> {
    const arr = Array.isArray(items) ? items : [items];

    const ids = Array.from(new Set(arr.map((i) => i.scraperId)));
    const list = await this.scrapers.findBy({ id: In(ids) });
    const map = new Map(list.map((s) => [s.id, s]));
    const result = arr.map((i) => {
      const s = map.get(i.scraperId);
      if (!s) {
        throw new InternalServerErrorException('Scraper not found');
      }
      return DocumentSchema.parse({
        ...i,
        scraper: { id: i.scraperId, name: s.name },
      });
    });

    if (Array.isArray(items)) {
      return result as T extends DocumentEntity[] ? DocumentDto[] : DocumentDto;
    }

    const [item] = result;
    if (!item) {
      throw new InternalServerErrorException('Mapping error');
    }
    return item as T extends DocumentEntity[] ? DocumentDto[] : DocumentDto;
  }
  @Get()
  @ApiOperation({ summary: 'List documents', description: 'Returns a paginated list of documents with filters (title, free-text q, scraperId, dateFrom/dateTo). Ordered by scrapedAt DESC.' })
  @ZodResponse({ type: DocumentsListResponseDto })
  async list(@Query() q: DocumentsListQueryDto) {
    const take = q.limit;
    const skip = q.offset;

    const qb = this.documents.createQueryBuilder('d');
    if (q.title) {
      qb.andWhere('d.title LIKE :title', { title: `%${q.title}%` });
    }
    if (q.q) {
      qb.andWhere('(d.title LIKE :qq OR d.content LIKE :qq)', {
        qq: `%${q.q}%`,
      });
    }
    if (q.scraperId) {
      qb.andWhere('d.scraperId = :sid', { sid: q.scraperId });
    }
    if (q.dateFrom) {
      const from = new Date(q.dateFrom);
      if (!isNaN(from.getTime())) qb.andWhere('d.scrapedAt >= :from', { from });
    }
    if (q.dateTo) {
      const to = new Date(q.dateTo);
      if (!isNaN(to.getTime())) qb.andWhere('d.scrapedAt <= :to', { to });
    }

    const [items, total] = await qb
      .orderBy('d.scrapedAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    const mapped = await this.mapWithScrapers(items);
    return { items: mapped, total, limit: take, offset: skip };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID', description: 'Fetch a single document by its UUID and include its scraper display info.' })
  @ZodResponse({ type: DocumentDto })
  async getOne(@Param('id') id: string) {
    const item = await this.documents.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');

    return DocumentSchema.parse(await this.mapWithScrapers(item));
  }

  @Post()
  @ApiOperation({ summary: 'Create document', description: 'Create a new document. Content is normalized to string; contentHash is auto-computed if not provided.' })
  @ZodResponse({ type: DocumentDto })
  async create(@Body() body: DocumentCreateDto) {
    const title = body.title;
    const scraperId = body.scraperId;
    let content = body.content;
    if (typeof content !== 'string') content = JSON.stringify(content ?? '');

    const doc: Partial<DocumentEntity> = {
      title: title.trim(),
      scraperId: scraperId.trim(),
      content: content,
      scrapedAt: body.scrapedAt ? new Date(body.scrapedAt) : new Date(),
      contentHash: body.contentHash || sha256Hex(String(content)),
    };

    const entity = this.documents.create(doc) as unknown as DocumentEntity;
    const created = await this.documents.save(entity);

    return await this.mapWithScrapers(created);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document', description: 'Partially update document fields by UUID. Recomputes contentHash when content changes.' })
  @ZodResponse({ type: DocumentDto })
  async update(@Param('id') id: string, @Body() body: DocumentUpdateDto) {
    const item = await this.documents.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');

    const updated: Partial<DocumentEntity> = {};
    if (typeof body.title === 'string') updated.title = body.title;
    let contentChanged = false;
    if (body.content != null) {
      updated.content =
        typeof body.content === 'string'
          ? body.content
          : JSON.stringify(body.content);
      contentChanged = true;
    }
    if (typeof body.scraperId === 'string') updated.scraperId = body.scraperId;
    if (body.scrapedAt != null) updated.scrapedAt = new Date(body.scrapedAt);
    if (contentChanged) {
      updated.contentHash = sha256Hex(String(updated.content ?? item.content));
    }

    await this.documents.update({ id }, updated);
    const fresh = await this.documents.findOne({ where: { id } });

    return await this.mapWithScrapers(fresh!);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document', description: 'Delete a document by UUID.' })
  @ZodResponse({ type: OkResponseDto })
  async remove(@Param('id') id: string) {
    const item = await this.documents.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    await this.documents.delete({ id });
    return { ok: true };
  }
}
