import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().nullable(),
  prompt: z.string().min(1),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TaskDto = z.infer<typeof TaskSchema>;

export const TaskCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  prompt: z.string().min(1),
});
export type TaskCreateDto = z.infer<typeof TaskCreateSchema>;

export const TaskUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    prompt: z.string().min(1).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });
export type TaskUpdateDto = z.infer<typeof TaskUpdateSchema>;

export const TasksListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type TasksListQueryDto = z.infer<typeof TasksListQuerySchema>;

export const TasksListResponseSchema = z.object({
  items: z.array(TaskSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
});
export type TasksListResponseDto = z.infer<typeof TasksListResponseSchema>;

// Classes for nestjs-zod
import { createZodDto } from 'nestjs-zod';

export class TaskDtoClass extends createZodDto(TaskSchema) {}
export class TaskCreateDtoClass extends createZodDto(TaskCreateSchema) {}
export class TaskUpdateDtoClass extends createZodDto(TaskUpdateSchema) {}
export class TasksListQueryDtoClass extends createZodDto(TasksListQuerySchema) {}
export class TasksListResponseDtoClass extends createZodDto(TasksListResponseSchema) {}
