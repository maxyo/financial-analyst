import { createHash } from 'node:crypto';

import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { errorMessage, getN, getQ } from '../../../../../lib/utils/http';
import { DocumentsRepository } from '../repositories/documents.repository';
import { DocumentCreateDto, DocumentUpdateDto, DocumentsListQueryDto, DocumentDto, DocumentsListResponseDto } from '../dto/documents.dto';
import { DocumentEntity } from '../entities/document.entity';

import type { Response } from 'express';

function sha256Hex(s: string): string {
  const h = createHash('sha256');
  h.update(s);
  return h.digest('hex');
}

@ApiTags('Documents')
@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsRepository) {}

  @Get()
  @ApiOkResponse({ type: DocumentsListResponseDto, description: 'List documents with pagination' })
  async list(@Query() _q: DocumentsListQueryDto, @Res() res: Response) {
    try {
      const take = getN(getQ({ query: _q } as any, 'limit')) || 50;
      const skip = getN(getQ({ query: _q } as any, 'offset')) || 0;
      const [items, total] = await this.documents.findAndCount({
        order: { scrapedAt: 'DESC' as const },
        take,
        skip,
      });
      res.json({ items, total, limit: take, offset: skip });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Get(':id')
  @ApiOkResponse({ type: DocumentDto, description: 'Document by id' })
  async getOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const item = await this.documents.findOne({ where: { id } as any });
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Post()
  @ApiOkResponse({ type: DocumentDto, description: 'Created document' })
  async create(@Body() body: DocumentCreateDto, @Res() res: Response) {
    try {
      const title = body?.title;
      const scraperId = body?.scraperId;
      let content = body?.content;
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'title is required (string)' });
      }
      if (typeof scraperId !== 'string' || !scraperId.trim()) {
        return res.status(400).json({ error: 'scraperId is required (uuid string)' });
      }
      if (typeof content !== 'string') content = JSON.stringify(content ?? '');

      const doc: Partial<DocumentEntity> = {
        title: title.trim(),
        scraperId: scraperId.trim(),
        content: content,
        scrapedAt: body?.scrapedAt ? new Date(body.scrapedAt) : new Date(),
        contentHash: body?.contentHash || sha256Hex(String(content)),
      };

      const created = await this.documents.save(this.documents.create(doc as any));
      res.status(201).json(created);
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Patch(':id')
  @ApiOkResponse({ type: DocumentDto, description: 'Updated document' })
  async update(@Param('id') id: string, @Body() body: DocumentUpdateDto, @Res() res: Response) {
    try {
      const item = await this.documents.findOne({ where: { id } as any });
      if (!item) return res.status(404).json({ error: 'Not found' });

      const updated: Partial<DocumentEntity> = {};
      if (typeof body.title === 'string') updated.title = body.title;
      let contentChanged = false;
      if (body.content != null) {
        updated.content = typeof body.content === 'string' ? body.content : JSON.stringify(body.content);
        contentChanged = true;
      }
      if (typeof body.scraperId === 'string') updated.scraperId = body.scraperId;
      if (body.scrapedAt != null) updated.scrapedAt = new Date(body.scrapedAt as any);
      if (contentChanged) {
        updated.contentHash = sha256Hex(String(updated.content ?? item.content));
      }

      await this.documents.update({ id } as any, updated as any);
      const fresh = await this.documents.findOne({ where: { id } as any });
      res.json(fresh);
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Delete(':id')
  @ApiOkResponse({ schema: { properties: { ok: { type: 'boolean', example: true } } }, description: 'Delete result' })
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const item = await this.documents.findOne({ where: { id } as any });
      if (!item) return res.status(404).json({ error: 'Not found' });
      await this.documents.delete({ id } as any);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }
}
