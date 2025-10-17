import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class OkResponseDto extends createZodDto(z.object({ ok: z.boolean() })) {}
