import assert from 'node:assert';

import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ZodSerializationException } from 'nestjs-zod';
import { map, Observable } from 'rxjs';

// NOTE (external)
// We need to deduplicate them here due to the circular dependency
// between core and common packages
const REFLECTOR = 'Reflector';
interface UnknownSchema {
  parse(input: unknown): unknown;
  array?: () => UnknownSchema;
  encode(arg: unknown): unknown
}
interface ZodDto<
  TSchema extends UnknownSchema = UnknownSchema,
  TCodec extends boolean = boolean
> {
  new (): ReturnType<TSchema['parse']>
  isZodDto: true
  schema: TSchema
  codec: TCodec
  create(input: unknown): ReturnType<TSchema['parse']>
  Output: ZodDto<UnknownSchema, TCodec>
  _OPENAPI_METADATA_FACTORY(): unknown
  encode(): unknown
}

const ZodSerializerDtoOptions = 'ZOD_SERIALIZER_DTO_OPTIONS' as const;
const createZodSerializationException = (error: unknown) => {
  return new ZodSerializationException(error);
};
function isZodDto(metatype: unknown): metatype is ZodDto<UnknownSchema> {
  return Boolean(
    metatype &&
      (typeof metatype === 'object' || typeof metatype === 'function') &&
      'isZodDto' in metatype &&
      metatype.isZodDto,
  );
}
@Injectable()
export class ZodSerializerInterceptor implements NestInterceptor {
  constructor(@Inject(REFLECTOR) protected readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const responseSchema = this.getContextResponseSchema(context);

    const toCamel = (input: any): any => {
      if (Array.isArray(input)) return input.map((v) => toCamel(v));
      if (!input || typeof input !== 'object') return input;
      // Keep Date instances as-is
      if (input instanceof Date) return input;
      const out: any = {};
      for (const [key, value] of Object.entries(input)) {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        out[camelKey] = toCamel(value);
      }
      return out;
    };

    return next.handle().pipe(
      map((res: object | object[]) => {
        if (!responseSchema) return res;
        if (res instanceof StreamableFile) return res;

        const camelized = toCamel(res);

        if (Array.isArray(responseSchema)) {
          const schemaOrDto = responseSchema[0];
          const schema =
            'schema' in schemaOrDto ? schemaOrDto.schema : schemaOrDto;
          assert(
            'array' in schema && typeof schema.array === 'function',
            'ZodSerializerDto was used with array syntax (e.g. `ZodSerializerDto([MyDto])`) but the DTO schema does not have an array method',
          );

          const arrSchema = schema.array();

          if (isZodDto(schemaOrDto)) {
            if (schemaOrDto.codec) {
              assert(arrSchema.encode, 'Schema does not have an encode method');

              try {
                return arrSchema.encode(camelized as unknown[]);
              } catch (error) {
                throw createZodSerializationException(error);
              }
            }

            try {
              return arrSchema.parse(camelized);
            } catch (error) {
              throw createZodSerializationException(error);
            }
          }

          try {
            return arrSchema.parse(camelized);
          } catch (error) {
            throw createZodSerializationException(error);
          }
        }

        if (isZodDto(responseSchema)) {
          if (responseSchema.codec) {
            assert(
              responseSchema.schema.encode,
              'Schema does not have an encode method',
            );

            try {
              return responseSchema.schema.encode(camelized);
            } catch (error) {
              throw createZodSerializationException(error);
            }
          }

          try {
            return responseSchema.schema.parse(camelized);
          } catch (error) {
            throw createZodSerializationException(error);
          }
        }

        try {
          return (responseSchema as any).parse(camelized);
        } catch (error) {
          throw createZodSerializationException(error);
        }
      }),
    );
  }

  protected getContextResponseSchema(
    context: ExecutionContext,
  ): ZodDto<UnknownSchema> | UnknownSchema | [ZodDto<UnknownSchema>] | [UnknownSchema] | undefined {
    return this.reflector.getAllAndOverride(ZodSerializerDtoOptions, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
}
