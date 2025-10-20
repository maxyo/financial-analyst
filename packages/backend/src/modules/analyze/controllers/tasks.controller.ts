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
  TaskCreateDtoClass as TaskCreateDto,
  TaskDtoClass as TaskDto,
  TasksListQueryDtoClass as TasksListQueryDto,
  TasksListResponseDtoClass as TasksListResponseDto,
  TaskUpdateDtoClass as TaskUpdateDto
} from '../dto/tasks.dto';
import { TaskEntity } from '../entities/task.entity';
import { TasksRepository } from '../repositories/tasks.repository';

@ApiTags('Tasks')
@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasks: TasksRepository) {}

  @Get()
  @ApiOperation({ summary: 'List tasks', description: 'Returns a paginated list of tasks ordered by id DESC.' })
  @ZodResponse({ type: TasksListResponseDto })
  async list(@Query() q: TasksListQueryDto) {
    const take = q.limit;
    const skip = q.offset;
    const [items, total] = await this.tasks.findAndCount({ order: { id: 'DESC' as const }, take, skip });
    const shaped = items.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? null,
      prompt: t.prompt,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
    return { items: shaped, total, limit: take, offset: skip };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID', description: 'Fetch a single task by its numeric ID.' })
  @ZodResponse({ type: TaskDto })
  async getOne(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) throw new NotFoundException('Not found');
    const item = await this.tasks.findOne({ where: { id: numId } });
    if (!item) throw new NotFoundException('Not found');
    return {
      id: item.id,
      name: item.name,
      description: item.description ?? null,
      prompt: item.prompt,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create task', description: 'Create a new analysis task with name, optional description, and prompt.' })
  @ZodResponse({ type: TaskDto, status: 201 })
  async create(@Body() body: TaskCreateDto) {
    const now = new Date().toISOString();
    const entity = this.tasks.create({
      ...body,
      created_at: now,
      updated_at: now,
    });

    const saved = await this.tasks.save(entity);
    return {
      id: saved.id,
      name: saved.name,
      description: saved.description ?? null,
      prompt: saved.prompt,
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task', description: 'Partially update task fields by numeric ID.' })
  @ZodResponse({ type: TaskDto })
  async update(@Param('id') id: string, @Body() body: TaskUpdateDto) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) throw new NotFoundException('Not found');
    const item = await this.tasks.findOne({ where: { id: numId } });
    if (!item) throw new NotFoundException('Not found');
    const patch: Partial<TaskEntity> = body;
    patch.updated_at = new Date().toISOString();
    await this.tasks.update({ id: numId }, body);
    const fresh = await this.tasks.findOne({ where: { id: numId } });
    if(!fresh) throw new InternalServerErrorException('Failed to update task');
    return {
      id: fresh.id,
      name: fresh.name,
      description: fresh.description ?? null,
      prompt: fresh.prompt,
      createdAt: fresh.created_at,
      updatedAt: fresh.updated_at,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task', description: 'Delete a task by numeric ID.' })
  @ZodResponse({ type: OkResponseDto })
  async remove(@Param('id') id: string) {
    const numId = Number(id);
    const item = await this.tasks.findOne({ where: { id: numId } });
    if (!item) throw new NotFoundException('Not found');
    await this.tasks.delete({ id: numId });
    return { ok: true };
  }
}
