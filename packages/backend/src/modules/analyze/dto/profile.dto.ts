import { z } from 'zod';

export const ProfileCreateSchema = z
  .object({
    name: z.string().min(1).describe('Profile name'),
    description: z
      .string()
      .nullable()
      .optional()
      .describe('Profile description (optional)'),
  })
  .describe('Create analysis profile');

export const ProfileUpdateSchema = z
  .object({
    name: z.string().min(1).optional().describe('Profile name'),
    description: z
      .string()
      .nullable()
      .optional()
      .describe('Profile description'),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field must be provided' })
  .describe('Partial update of analysis profile');

export const ProfileSchema = z
  .object({
    id: z.number().int().positive().describe('Profile ID'),
    name: z.string().describe('Profile name'),
    description: z.string().nullable().describe('Profile description (may be absent)'),
    createdAt: z.string().describe('Creation time (ISO 8601)'),
    updatedAt: z.string().describe('Update time (ISO 8601)'),
    topicId: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional()
      .describe('Related topic (if used)'),
  })
  .describe('Analysis profile');

export const ProfilesListQuerySchema = z
  .object({
    limit: z
      .coerce
      .number()
      .int()
      .min(1)
      .max(200)
      .default(50)
      .describe('Page size (default 50, up to 200)'),
    offset: z
      .coerce
      .number()
      .int()
      .min(0)
      .default(0)
      .describe('Offset/start index (default 0)'),
  })
  .describe('Pagination parameters');

export const ProfilesListResponseSchema = z
  .object({
    items: z.array(ProfileSchema).describe('Profiles list'),
    total: z.number().int().nonnegative().describe('Total profiles count'),
    limit: z.number().int().min(1).describe('Page size'),
    offset: z.number().int().min(0).describe('Offset'),
  })
  .describe('Profiles list response');

export const AssignDocumentSourceSchema = z
  .object({
    documentId: z.uuid().describe('UUID of the document to be linked to the profile'),
  })
  .describe('Link a document source to a profile');

export const DocumentSourceSchema = z
  .object({
    id: z.number().int().positive().describe('Profile-document link identifier'),
    documentId: z.uuid().describe('Document UUID'),
  })
  .describe('Document linked to a profile');

export const DocumentSourcesListResponseSchema = z
  .object({
    items: z.array(DocumentSourceSchema).describe('List of linked documents'),
    total: z.number().int().nonnegative().describe('Total links count'),
    limit: z.number().int().min(1).describe('Page size'),
    offset: z.number().int().min(0).describe('Offset'),
  })
  .describe('Response with list of linked document sources');

export const AssignTaskSchema = z
  .object({
    taskId: z
      .coerce
      .number()
      .int()
      .positive()
      .describe('ID задачи анализа, которую нужно назначить профилю'),
  })
  .describe('Назначение задачи профилю');

export const ProfileTaskSchema = z
  .object({
    taskId: z
      .number()
      .int()
      .positive()
      .nullable()
      .describe('ID назначенной задачи или null, если не назначена'),
  })
  .describe('Информация о назначенной задаче');

// Classes for nestjs-zod
import { createZodDto } from 'nestjs-zod';

export class ProfileDto extends createZodDto(ProfileSchema) {}
export class ProfileCreateDto extends createZodDto(ProfileCreateSchema) {}
export class ProfileUpdateDto extends createZodDto(ProfileUpdateSchema) {}
export class ProfilesListQueryDto extends createZodDto(ProfilesListQuerySchema) {}
export class ProfilesListResponseDto extends createZodDto(ProfilesListResponseSchema) {}
export class AssignDocumentSourceDto extends createZodDto(AssignDocumentSourceSchema) {}
export class DocumentSourceDto extends createZodDto(DocumentSourceSchema) {}
export class DocumentSourcesListResponseDto extends createZodDto(DocumentSourcesListResponseSchema) {}
export class AssignTaskDto extends createZodDto(AssignTaskSchema) {}
export class ProfileTaskDto extends createZodDto(ProfileTaskSchema) {}
