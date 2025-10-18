import { z } from 'zod';

export const ProfileCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const ProfileUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field must be provided' });

export const ProfileSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ProfilesListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ProfilesListResponseSchema = z.object({
  items: z.array(ProfileSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});

export const AssignDocumentSourceSchema = z.object({
  documentId: z.uuid(),
});

export const DocumentSourceSchema = z.object({
  id: z.number().int().positive(),
  documentId: z.uuid(),
});

export const DocumentSourcesListResponseSchema = z.object({
  items: z.array(DocumentSourceSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});

export const AssignTaskSchema = z.object({
  taskId: z.coerce.number().int().positive(),
});

export const ProfileTaskSchema = z.object({
  taskId: z.number().int().positive().nullable(),
});

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
