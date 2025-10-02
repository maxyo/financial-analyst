import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentsListQueryDto {
  @ApiPropertyOptional({ description: 'Limit', example: 50 })
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset', example: 0 })
  offset?: number;
}

export class DocumentCreateDto {
  @ApiProperty()
  title!: string;

  @ApiProperty({ description: 'UUID of scraper', format: 'uuid' })
  scraperId!: string;

  @ApiProperty({ description: 'Content of the document. If non-string is provided will be stringified.' })
  content!: any;

  @ApiPropertyOptional({ description: 'Scraped at date', type: String, format: 'date-time' })
  scrapedAt?: string | Date;

  @ApiPropertyOptional({ description: 'Content hash. If omitted, server computes sha256(content).' })
  contentHash?: string;
}

export class DocumentUpdateDto {
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Content of the document. If non-string is provided will be stringified.' })
  content?: any;

  @ApiPropertyOptional({ description: 'UUID of scraper', format: 'uuid' })
  scraperId?: string;

  @ApiPropertyOptional({ description: 'Scraped at date', type: String, format: 'date-time' })
  scrapedAt?: string | Date;
}

export class IdParamDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

export class OkResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}

export class DocumentDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ format: 'uuid' })
  scraperId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  scrapedAt!: string | Date;

  @ApiProperty()
  contentHash!: string;
}

export class DocumentsListResponseDto {
  @ApiProperty({ type: [DocumentDto] })
  items!: DocumentDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}
