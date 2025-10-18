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
  ReportCreateDto,
  ReportDto,
  ReportSchema,
  ReportsListQueryDto,
  ReportsListResponseDto, ReportsListResponseSchema,
  ReportUpdateDto,
} from '../dto/report.dto';
import { ReportEntity } from '../entities/report/report.entity';
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
  @ZodResponse({ type: ReportDto })
  async getOne(@Param('id') id: string) {
    const item = await this.reports.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    return ReportSchema.parse(item);
  }

  @Post()
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
  @ZodResponse({ type: ReportDto })
  async update(@Param('id') id: string, @Body() body: ReportUpdateDto) {
    const item = await this.reports.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    const patch: Partial<ReportEntity> = body;
    await this.reports.update({ id }, patch);

    const result = await this.reports.findOne({ where: { id } });
    if (!result) {
      throw new InternalServerErrorException('Failed to update report');
    }

    return ReportSchema.parse(result);
  }

  @Delete(':id')
  @ZodResponse({ type: OkResponseDto })
  async remove(@Param('id') id: string) {
    const item = await this.reports.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    await this.reports.delete({ id });
    return { ok: true };
  }
}
