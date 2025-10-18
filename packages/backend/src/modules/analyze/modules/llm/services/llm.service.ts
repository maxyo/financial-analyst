import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import * as Shared from 'openai/src/resources/shared';

@Injectable()
export class LlmService {
  private readonly client;
  constructor(config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
      baseURL: 'https://api.proxyapi.ru/openrouter/v1',
    });
  }

  async infer(message: string, responseFormat?: Shared.ResponseFormatJSONSchema): Promise<{
    message: string;
    inTokens: number;
    outTokens: number;
  }> {
    const completion = await this.client.chat.completions.create({
      model: 'mistralai/mistral-medium-3.1',
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      response_format: responseFormat,
    });

    const result = completion.choices[0].message.content;

    if (!result) throw new Error(`LLM returned empty response`);

    return {
      inTokens: completion.usage?.prompt_tokens ?? -1,
      outTokens: completion.usage?.completion_tokens ?? -1,
      message: result,
    };
  }
}
