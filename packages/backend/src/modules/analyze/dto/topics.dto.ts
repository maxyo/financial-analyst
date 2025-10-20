import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const TopicSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().nullable(),
  parent_id: z.number().int().positive().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TopicDto = z.infer<typeof TopicSchema>;

export const TopicCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  parent_id: z.number().int().positive().nullable().optional(),
});
export type TopicCreateDto = z.infer<typeof TopicCreateSchema>;

export const TopicUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    parent_id: z.number().int().positive().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });
export type TopicUpdateDto = z.infer<typeof TopicUpdateSchema>;

export const TopicsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type TopicsListQueryDto = z.infer<typeof TopicsListQuerySchema>;

export const TopicsListResponseSchema = z.object({
  items: z.array(TopicSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});
export type TopicsListResponseDto = z.infer<typeof TopicsListResponseSchema>;

export class TopicDtoClass extends createZodDto(TopicSchema) {}
export class TopicCreateDtoClass extends createZodDto(TopicCreateSchema) {}
export class TopicUpdateDtoClass extends createZodDto(TopicUpdateSchema) {}
export class TopicsListQueryDtoClass extends createZodDto(TopicsListQuerySchema) {}
export class TopicsListResponseDtoClass extends createZodDto(TopicsListResponseSchema) {}