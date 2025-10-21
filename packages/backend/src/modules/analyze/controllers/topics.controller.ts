import { Body, Controller, Delete, Get, InternalServerErrorException, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { OkResponseDto } from '../../../dto/response';
import { TopicEntity } from '../entities/topic.entity';
import { TopicCreateDtoClass as TopicCreateDto, TopicDtoClass as TopicDto, TopicUpdateDtoClass as TopicUpdateDto, TopicsListQueryDtoClass as TopicsListQueryDto, TopicsListResponseDtoClass as TopicsListResponseDto } from '../dto/topics.dto';
import { TopicsRepository } from '../repositories/topics.repository';

@ApiTags('Topics')
@Controller('api/topics')
export class TopicsController {
  constructor(private readonly topics: TopicsRepository) {}

  @Get()
  @ApiOperation({ summary: 'List topics', description: 'Returns a paginated list of topics ordered by id DESC. Includes parent relationship when present.' })
  @ZodResponse({ type: TopicsListResponseDto })
  async list(@Query() q: TopicsListQueryDto) {
    const take = q.limit;
    const skip = q.offset;
    const [items, total] = await this.topics.findAndCount({ order: { id: 'DESC' as const }, take, skip, relations: { parent: true } });
    const shaped = items.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? null,
      parentId: t.parent ? t.parent.id : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
    return { items: shaped, total, limit: take, offset: skip };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get topic by ID', description: 'Fetch a single topic by its numeric ID. Includes parent info when available.' })
  @ZodResponse({ type: TopicDto })
  async getOne(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) throw new NotFoundException('Not found');
    const item = await this.topics.findOne({ where: { id: numId }, relations: { parent: true } });
    if (!item) throw new NotFoundException('Not found');
    const shaped = {
      id: item.id,
      name: item.name,
      description: item.description ?? null,
      parentId: item.parent ? item.parent.id : null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
    return shaped;
  }

  @Post()
  @ApiOperation({ summary: 'Create topic', description: 'Create a new topic with optional description and parent reference.' })
  @ZodResponse({ type: TopicDto, status: 201 })
  async create(@Body() body: TopicCreateDto) {
    const now = new Date().toISOString();

    let parent: TopicEntity | null = null;
    if (body.parentId != null) {
      const p = await this.topics.findOne({ where: { id: body.parentId } });
      if (!p) throw new NotFoundException('Parent topic not found');
      parent = p;
    }

    const entity = this.topics.create({
      name: body.name,
      description: body.description ?? null,
      parent,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.topics.save(entity);
    return {
      id: saved.id,
      name: saved.name,
      description: saved.description ?? null,
      parentId: saved.parent ? saved.parent.id : null,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update topic', description: 'Partially update a topic by numeric ID. Supports changing name, description, and parent.' })
  @ZodResponse({ type: TopicDto })
  async update(@Param('id') id: string, @Body() body: TopicUpdateDto) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) throw new NotFoundException('Not found');
    const item = await this.topics.findOne({ where: { id: numId }, relations: { parent: true } });
    if (!item) throw new NotFoundException('Not found');

    // apply changes to loaded entity and save to avoid partial-type casts
    if (body.name !== undefined) item.name = body.name;
    if (body.description !== undefined) item.description = body.description;
    if ('parentId' in body) {
      if (body.parentId == null) {
        item.parent = null;
      } else {
        const p = await this.topics.findOne({ where: { id: body.parentId } });
        if (!p) throw new NotFoundException('Parent topic not found');
        if (p.id === numId) throw new NotFoundException('Parent cannot be self');
        item.parent = p;
      }
    }
    item.updatedAt = new Date().toISOString();

    const fresh = await this.topics.save(item);
    // reload with relation to shape consistently
    const reloaded = await this.topics.findOne({ where: { id: fresh.id }, relations: { parent: true } });
    if (!reloaded) throw new InternalServerErrorException('Failed to update topic');

    return {
      id: reloaded.id,
      name: reloaded.name,
      description: reloaded.description ?? null,
      parentId: reloaded.parent ? reloaded.parent.id : null,
      createdAt: reloaded.createdAt,
      updatedAt: reloaded.updatedAt,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete topic', description: 'Delete a topic by numeric ID.' })
  @ZodResponse({ type: OkResponseDto })
  async remove(@Param('id') id: string) {
    const numId = Number(id);
    const item = await this.topics.findOne({ where: { id: numId } });
    if (!item) throw new NotFoundException('Not found');
    await this.topics.delete({ id: numId });
    return { ok: true };
  }
}
