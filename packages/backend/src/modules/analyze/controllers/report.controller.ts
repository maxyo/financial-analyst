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
  ReportCreateDto,
  ReportDto,
  ReportSchema,
  ReportsListQueryDto,
  ReportsListResponseDto, ReportsListResponseSchema,
  ReportUpdateDto,
} from '../dto/report.dto';
import { AnalysisProfilesRepository } from '../repositories/analysis-profiles.repository';
import { ReportsRepository } from '../repositories/reports.repository';

@ApiTags('Reports')
@Controller('api/reports')
export class ReportController {
  constructor(
    private readonly reports: ReportsRepository,
    private readonly profiles: AnalysisProfilesRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List reports', description: 'Returns a paginated list of reports, optionally filtered by profile_id, ordered by created_at DESC.' })
  @ZodResponse({ type: ReportsListResponseDto })
  async list(@Query() q: ReportsListQueryDto) {
    const take = q.limit;
    const skip = q.offset;
    const where: Record<string, number> = {};
    if (q.profile_id != null) where.profile_id = q.profile_id;
    const [items, total] = await this.reports.findAndCount({
      where,
      order: { created_at: 'DESC' as const },
      take,
      skip,
    });
    return ReportsListResponseSchema.parse({
      items,
      total,
      limit: take,
      offset: skip,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID', description: 'Fetch a single report by its UUID.' })
  @ZodResponse({ type: ReportDto })
  async getOne(@Param('id') id: string) {
    const item = await this.reports.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    return ReportSchema.parse(item);
  }

  @Post()
  @ApiOperation({ summary: 'Create report', description: 'Create a new report for a given analysis profile and payload.' })
  @ZodResponse({ type: ReportDto, status: 201 })
  async create(@Body() body: ReportCreateDto) {
    const profileId = Number(body?.profile_id);
    const profile = await this.profiles.findOne({
      where: { id: profileId },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    const now = new Date();
    const entity = this.reports.create({
      ...body,
      profile_id: profileId,
      created_at: now,
    });

    return ReportSchema.parse(await this.reports.save(entity));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update report', description: 'Partially update report fields by UUID.' })
  @ZodResponse({ type: ReportDto })
  async update(@Param('id') id: string, @Body() body: ReportUpdateDto) {
    const item = await this.reports.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');

    // Assign allowed fields and save to avoid deep-partial typing issues
    if (body.type !== undefined) item.type = body.type;
    if (body.content !== undefined) item.content = body.content;
    if (body.llmModel !== undefined) item.llmModel = body.llmModel;
    if (body.tokens_in !== undefined) item.tokens_in = body.tokens_in;
    if (body.tokens_out !== undefined) item.tokens_out = body.tokens_out;
    if (body.cost !== undefined) item.cost = body.cost;

    const saved = await this.reports.save(item);
    if (!saved) {
      throw new InternalServerErrorException('Failed to update report');
    }

    return ReportSchema.parse(saved);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report', description: 'Delete a report by UUID.' })
  @ZodResponse({ type: OkResponseDto })
  async remove(@Param('id') id: string) {
    const item = await this.reports.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    await this.reports.delete({ id });
    return { ok: true };
  }
}
