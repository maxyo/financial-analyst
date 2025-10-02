import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';


import { errorMessage, getN, getQ } from '../../../../../lib/utils/http';
import { ListQueryDto, ScraperCreateDto, ScraperUpdateDto, ScraperDto, ScrapersListResponseDto } from '../dto/scrapers.dto';
import { ScrapersRepository } from '../repositories/scrapers.repository';
import { scrapperTypes } from '../types';

import type { Response } from 'express';

@ApiTags('Scrapers')
@Controller('api/scrapers')
export class ScrapersController {
  constructor(private readonly scrapers: ScrapersRepository) {}

  @Get()
  @ApiOkResponse({ type: ScrapersListResponseDto, description: 'List of scrapers with pagination' })
  async list(@Query() _q: ListQueryDto, @Res() res: Response) {
    try {
      const take = getN(getQ({ query: _q } as any, 'limit')) || 50;
      const skip = getN(getQ({ query: _q } as any, 'offset')) || 0;
      const [items, total] = await this.scrapers.findAndCount({
        order: { name: 'ASC' as const },
        take,
        skip,
      });
      res.json({ items, total, limit: take, offset: skip });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Get(':id')
  @ApiOkResponse({ type: ScraperDto, description: 'Scraper by id' })
  async getOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const item = await this.scrapers.findOne({ where: { id } as any });
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Post()
  @ApiOkResponse({ type: ScraperDto, description: 'Created scraper' })
  async create(@Body() body: ScraperCreateDto, @Res() res: Response) {
    try {
      const name = typeof body?.name === 'string' ? body.name.trim() : '';
      const type = body?.type;
      const config = body?.config as any;
      if (!name) return res.status(400).json({ error: 'name is required (string)' });
      if (!type || !scrapperTypes.includes(type)) {
        return res.status(400).json({ error: `type is required one of: ${scrapperTypes.join(', ')}` });
      }
      if (config == null || typeof config !== 'object') {
        return res.status(400).json({ error: 'config is required (object)' });
      }
      const created = await this.scrapers.save(this.scrapers.create({ name, type, config } as any));
      res.status(201).json(created);
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Patch(':id')
  @ApiOkResponse({ type: ScraperDto, description: 'Updated scraper' })
  async update(@Param('id') id: string, @Body() body: ScraperUpdateDto, @Res() res: Response) {
    try {
      const item = await this.scrapers.findOne({ where: { id } as any });
      if (!item) return res.status(404).json({ error: 'Not found' });
      const updated: any = {};
      if (typeof body.name === 'string') updated.name = body.name.trim();
      if (body.type && scrapperTypes.includes(body.type as any)) updated.type = body.type;
      if (body.config != null) updated.config = body.config;
      await this.scrapers.update({ id } as any, updated);
      const fresh = await this.scrapers.findOne({ where: { id } as any });
      res.json(fresh);
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }

  @Delete(':id')
  @ApiOkResponse({ schema: { properties: { ok: { type: 'boolean', example: true } } }, description: 'Delete result' })
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const item = await this.scrapers.findOne({ where: { id } as any });
      if (!item) return res.status(404).json({ error: 'Not found' });
      await this.scrapers.delete({ id } as any);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: errorMessage(e) });
    }
  }
}
