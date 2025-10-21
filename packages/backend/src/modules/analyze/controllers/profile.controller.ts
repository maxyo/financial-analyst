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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { AnalysisProfilesRepository } from '../repositories/analysis-profiles.repository';
import { DocumentSourcesRepository } from '../repositories/document-sources.repository';
import { DocumentsRepository } from '../repositories/documents.repository';
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
  @ApiOperation({
    summary: 'List profiles',
    description:
      'Returns a paginated list of analysis profiles. Sorted by id DESC. Query params: limit, offset.',
  })
  @ZodResponse({ type: ProfilesListResponseDto })
  async list(@Query() q: ProfilesListQueryDto) {
    const take = q.limit ?? 50;
    const skip = q.offset ?? 0;
    const [items, total] = await this.profiles.findAndCount({
      where: {
        topic: { id: q.topicId },
      },
      order: { id: 'DESC' as const },
      take,
      skip,
    });
    const shaped = items.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      topicId: p.topic?.id,
    }));
    return {
      items: shaped,
      total,
      limit: take,
      offset: skip,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get profile',
    description: 'Returns a profile by numeric identifier.',
  })
  @ZodResponse({ type: ProfileDto, description: 'Profile by id' })
  async getOne(@Param('id') id: string) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const item = await this.profiles.findOne({
      where: { id: numId },
      relations: ['topic'],
    });
    if (!item) throw new NotFoundException('Not found');
    return {
      id: item.id,
      name: item.name,
      description: item.description ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      topicId: item.topic ? item.topic.id : null,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Create profile',
    description: 'Creates a new analysis profile.',
  })
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
      createdAt: now,
      updatedAt: now,
      topic: { id: body.topicId },
    });

    const saved = await this.profiles.save(entity);
    return {
      id: saved.id,
      name: saved.name,
      description: saved.description ?? null,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      topicId: saved.topic?.id,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update profile',
    description: 'Partially updates profile fields by ID.',
  })
  @ZodResponse({ type: ProfileDto, description: 'Updated profile' })
  async update(@Param('id') id: string, @Body() body: ProfileUpdateDto) {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      throw new BadRequestException('id must be a number');
    }
    const item = await this.profiles.findOne({ where: { id: numId } });
    if (!item) throw new NotFoundException('Not found');
    if (body.name !== undefined) item.name = body.name;
    if (body.description !== undefined) item.description = body.description;
    item.updatedAt = new Date().toISOString();
    const saved = await this.profiles.save(item);
    if (!saved) {
      throw new InternalServerErrorException('Failed to update profile');
    }
    return {
      id: saved.id,
      name: saved.name,
      description: saved.description ?? null,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
      topicId: undefined,
    };
  }

  @Get(':id/document-sources')
  @ApiOperation({
    summary: 'List profile document sources',
    description: 'Returns a paginated list of documents linked to the profile.',
  })
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
      where: { profileId: numId },
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
  @ApiOperation({
    summary: 'Assign document to profile',
    description: 'Creates a profile-document link if it does not exist.',
  })
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
      where: { profileId: numId, documentId: docId },
    });
    if (!link) {
      const entity = this.docSources.create({
        profileId: numId,
        documentId: docId,
      });

      link = await this.docSources.save(entity);
    }
    return link;
  }

  @Delete(':id/document-sources/:documentId')
  @ApiOperation({
    summary: 'Unassign document from profile',
    description: 'Deletes the profile-document link.',
  })
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
      where: { profileId: numId, documentId },
    });
    if (!link) throw new NotFoundException('Not found');
    await this.docSources.delete({ id: link.id });
    return { ok: true };
  }

  @Post(':id/task')
  @ApiOperation({
    summary: 'Assign task to profile',
    description: 'Links an analysis task to the profile.',
  })
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

    // Assign task by loading entity and saving to avoid deep-partial typing issues
    profile.task = task;
    profile.updatedAt = new Date().toISOString();
    await this.profiles.save(profile);
    return { taskId } as ProfileTaskDto;
  }

  @Get(':id/task')
  @ApiOperation({
    summary: 'Get profile task',
    description:
      'Returns the identifier of the task assigned to the profile (or null).',
  })
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
  @ApiOperation({
    summary: 'Unassign task from profile',
    description:
      'Unlinks the previously assigned analysis task from the profile.',
  })
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
    // Unassign task by loading entity and saving
    profile.task = null;
    profile.updatedAt = new Date().toISOString();
    await this.profiles.save(profile);
    return { ok: true };
  }

  @Post(':id/run')
  @ApiOperation({
    summary: 'Run aggregate analysis',
    description: 'Enqueues an aggregate analysis job for the profile.',
  })
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
      profileId: numId,
      status: 'pending',
      createdAt: new Date(),
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
        jobId: String(job.id),
        status: 'running',
        startedAt: new Date(),
      },
    );
    return {
      ok: true,
      jobId: String(job.id),
      executionId: exec.id,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete profile',
    description: 'Deletes a profile by ID.',
  })
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
