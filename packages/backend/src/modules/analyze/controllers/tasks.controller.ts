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
  @ZodResponse({ type: TasksListResponseDto })
  async list(@Query() q: TasksListQueryDto) {
    const take = q.limit;
    const skip = q.offset;
    const [items, total] = await this.tasks.findAndCount({ order: { id: 'DESC' as const }, take, skip });
    return { items, total, limit: take, offset: skip };
  }

  @Get(':id')
  @ZodResponse({ type: TaskDto })
  async getOne(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) throw new NotFoundException('Not found');
    const item = await this.tasks.findOne({ where: { id: numId } });
    if (!item) throw new NotFoundException('Not found');
    return item;
  }

  @Post()
  @ZodResponse({ type: TaskDto, status: 201 })
  async create(@Body() body: TaskCreateDto) {
    const now = new Date().toISOString();
    const entity = this.tasks.create({
      ...body,
      created_at: now,
      updated_at: now,
    });

    return await this.tasks.save(entity);
  }

  @Patch(':id')
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
    return fresh;
  }

  @Delete(':id')
  @ZodResponse({ type: OkResponseDto })
  async remove(@Param('id') id: string) {
    const numId = Number(id);
    const item = await this.tasks.findOne({ where: { id: numId } });
    if (!item) throw new NotFoundException('Not found');
    await this.tasks.delete({ id: numId });
    return { ok: true };
  }
}
