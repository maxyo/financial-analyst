import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
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
import { ApiTags } from '@nestjs/swagger';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';

// Use DTO classes compatible with ZodResponse
import { OkResponseDto } from '../../../dto/response';
import {
  AssignDocumentSourceDto,
  AssignTaskDto,
  DocumentSourceDto,
  DocumentSourcesListResponseDto,
  ProfileCreateDto,
  ProfileDto,
  ProfilesListQueryDto,
  ProfilesListResponseDto,
  ProfileTaskDto,
  ProfileUpdateDto
} from '../dto/profile.dto';
import { ProfileEntity } from '../entities/profile.entity';
import { DocumentsRepository } from '../modules/scraper/repositories/documents.repository';
import { AnalysisProfilesRepository } from '../repositories/analysis-profiles.repository';
import { DocumentSourcesRepository } from '../repositories/document-sources.repository';
import { ProfileExecutionsRepository } from '../repositories/profile-executions.repository';
import { TasksRepository } from '../repositories/tasks.repository';

import type { Queue } from 'bullmq';

export class ProfileRunResponseDto extends createZodDto(
  z.object({
    ok: z.boolean(),
    jobId: z.string(),
    executionId: z.uuid(),
  }),
) {}

@ApiTags('Profiles')
@Controller('api/profiles')
export class ProfileController {
  constructor(
    private readonly profiles: AnalysisProfilesRepository,
    private readonly docSources: DocumentSourcesRepository,
    private readonly documents: DocumentsRepository,
    private readonly tasks: TasksRepository,
    private readonly executions: ProfileExecutionsRepository,
    @InjectQueue('ai.aggregate-analysis')
    private readonly aggregateQueue: Queue,
  ) {}

  @Get()
  @ZodResponse({ type: ProfilesListResponseDto })
  async list(@Query() q: ProfilesListQueryDto) {
    const take = q.limit ?? 50;
    const skip = q.offset ?? 0;
    const [items, total] = await this.profiles.findAndCount({
      order: { id: 'DESC' as const },
      take,
      skip,
    });
    return {
      items,
      total,
      limit: take,
      offset: skip,
    };
  }

  @Get(':id')
  @ZodResponse({ type: ProfileDto, description: 'Profile by id' })
  async getOne(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const item = await this.profiles.findOne({ where: { id: numId } });
    if (!item) throw new NotFoundException('Not found');
    return item;
  }

  @Post()
  @ZodResponse({
    type: ProfileDto,
    status: 201,
    description: 'Created profile',
  })
  async create(@Body() body: ProfileCreateDto) {
    const now = new Date().toISOString();
    const entity = this.profiles.create({
      name: body.name.trim(),
      description: body.description,
      created_at: now,
      updated_at: now,
    });

    return await this.profiles.save(entity);
  }

  @Patch(':id')
  @ZodResponse({ type: ProfileDto, description: 'Updated profile' })
  async update(@Param('id') id: string, @Body() body: ProfileUpdateDto) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const item = await this.profiles.findOne({ where: { id: numId } });
    if (!item) throw new NotFoundException('Not found');
    const patch: Partial<ProfileEntity> = body;
    patch.updated_at = new Date().toISOString();
    await this.profiles.update({ id: numId }, patch);
    const fresh = await this.profiles.findOne({
      where: { id: numId },
    });
    if (!fresh)
      {throw new InternalServerErrorException('Failed to update profile');}
    return fresh;
  }

  @Get(':id/document-sources')
  @ZodResponse({
    type: DocumentSourcesListResponseDto,
    description: 'List document sources assigned to profile',
  })
  async listSources(@Param('id') id: string, @Query() q: ProfilesListQueryDto) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const profile = await this.profiles.findOne({
      where: { id: numId },
    });
    if (!profile) throw new NotFoundException('Not found');
    const take = q.limit;
    const skip = q.offset;
    const [items, total] = await this.docSources.findAndCount({
      where: { profile_id: numId },
      order: { id: 'DESC' as const },
      take,
      skip,
    });
    return {
      items,
      total,
      limit: take,
      offset: skip,
    };
  }

  @Post(':id/document-sources')
  @ZodResponse({
    type: DocumentSourceDto,
    status: 201,
    description: 'Assigned document source',
  })
  async assignSource(
    @Param('id') id: string,
    @Body() body: AssignDocumentSourceDto,
  ) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const profile = await this.profiles.findOne({
      where: { id: numId },
    });
    if (!profile) throw new NotFoundException('Not found');
    const docId = body.documentId;
    const doc = await this.documents.findOne({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Document not found');

    let link = await this.docSources.findOne({
      where: { profile_id: numId, documentId: docId },
    });
    if (!link) {
      const entity = this.docSources.create({
        profile_id: numId,
        documentId: docId,
      });

      link = await this.docSources.save(entity);
    }
    return link;
  }

  @Delete(':id/document-sources/:documentId')
  @ZodResponse({
    type: OkResponseDto,
    description: 'Unassign result',
  })
  async unassignSource(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const profile = await this.profiles.findOne({
      where: { id: numId },
    });
    if (!profile) throw new NotFoundException('Not found');
    if (typeof documentId !== 'string' || !documentId.trim()) {
      throw new BadRequestException('documentId is required (uuid string)');
    }
    const link = await this.docSources.findOne({
      where: { profile_id: numId, documentId },
    });
    if (!link) throw new NotFoundException('Not found');
    await this.docSources.delete({ id: link.id });
    return { ok: true };
  }

  @Post(':id/task')
  @ZodResponse({
    type: ProfileTaskDto,
    status: 201,
    description: 'Assigned task result',
  })
  async assignTask(@Param('id') id: string, @Body() body: AssignTaskDto) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const profile = await this.profiles.findOne({
      where: { id: numId },
    });
    if (!profile) throw new NotFoundException('Not found');
    const taskId = Number(body?.taskId);
    if (!Number.isFinite(taskId) || taskId <= 0) {
      throw new BadRequestException('taskId is required (positive number)');
    }
    const task = await this.tasks.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const patch: Partial<ProfileEntity> = {
      task: task,
      updated_at: new Date().toISOString(),
    };
    await this.profiles.update({ id: numId }, patch);
    return { taskId } as ProfileTaskDto;
  }

  @Get(':id/task')
  @ZodResponse({
    type: ProfileTaskDto,
    description: 'Get assigned task for profile',
  })
  async getTask(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const profile = await this.profiles.findOne({
      where: { id: numId },
      relations: ['task'],
    });
    if (!profile) throw new NotFoundException('Not found');
    const taskId = profile.task?.id ?? null;
    return { taskId };
  }

  @Delete(':id/task')
  @ZodResponse({
    type: OkResponseDto,
    description: 'Unassign task from profile',
  })
  async unassignTask(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const profile = await this.profiles.findOne({
      where: { id: numId },
    });
    if (!profile) throw new NotFoundException('Not found');
    const patch: Partial<ProfileEntity> = {
      task: null,
      updated_at: new Date().toISOString(),
    };
    await this.profiles.update({ id: numId }, patch);
    return { ok: true };
  }

  @Post(':id/run')
  @ZodResponse({
    type: ProfileRunResponseDto,
    description: 'Enqueue aggregate analysis job for profile',
  })
  async runAggregate(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const profile = await this.profiles.findOne({
      where: { id: numId },
    });
    if (!profile) throw new NotFoundException('Not found');
    const execEntity = this.executions.create({
      profile_id: numId,
      status: 'pending',
      created_at: new Date(),
    });
    const exec = await this.executions.save(execEntity);
    // Enqueue job and update execution with job id and running status
    const job = await this.aggregateQueue.add(
      'ai.aggregate-analysis',
      { profileId: numId, executionId: exec.id },
      { removeOnComplete: true, removeOnFail: 10 },
    );
    await this.executions.update(
      { id: exec.id },
      {
        job_id: String(job.id),
        status: 'running',
        started_at: new Date(),
      },
    );
    return {
      ok: true,
      jobId: String(job.id),
      executionId: exec.id,
    };
  }

  @Delete(':id')
  @ZodResponse({
    type: OkResponseDto,
    description: 'Delete result',
  })
  async remove(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const item = await this.profiles.findOne({ where: { id: numId } });
    if (!item) throw new NotFoundException('Not found');
    await this.profiles.delete({ id: numId });
    return { ok: true };
  }
}
