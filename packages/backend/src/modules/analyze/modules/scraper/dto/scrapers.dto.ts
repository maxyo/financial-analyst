import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { scrapperTypes, ScraperConfiguration, ScraperType } from '../types';

export class ListQueryDto {
  @ApiPropertyOptional({ description: 'Limit', example: 50 })
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset', example: 0 })
  offset?: number;
}

export class ScraperCreateDto<T extends ScraperType = ScraperType> {
  @ApiProperty({ description: 'Scraper name' })
  name!: string;

  @ApiProperty({ description: 'Scraper type', enum: scrapperTypes })
  type!: T;

  @ApiProperty({ description: 'Scraper config', type: Object })
  // loose typing for swagger
  config!: ScraperConfiguration[T] | Record<string, any>;
}

export class ScraperUpdateDto<T extends ScraperType = ScraperType> {
  @ApiPropertyOptional({ description: 'Scraper name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Scraper type', enum: scrapperTypes })
  type?: T;

  @ApiPropertyOptional({ description: 'Scraper config', type: Object })
  config?: ScraperConfiguration[T] | Record<string, any>;
}

export class IdParamDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

export class OkResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}

export class PaginationResponseDto<T> {
  @ApiProperty({ isArray: true, type: Object })
  items!: T[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}

export class ScraperDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: scrapperTypes })
  type!: ScraperType;

  @ApiProperty({ type: Object })
  config!: Record<string, any>;
}

export class ScrapersListResponseDto {
  @ApiProperty({ type: [ScraperDto] })
  items!: ScraperDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}
