/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TasksListResponseDtoClass_Output = {
    items: Array<{
        /**
         * Идентификатор задачи
         */
        id: number;
        /**
         * Название задачи
         */
        name: string;
        /**
         * Описание задачи (может отсутствовать)
         */
        description: (string | null);
        /**
         * Подсказка/шаблон запроса для ИИ
         */
        prompt: string;
        /**
         * Время создания (ISO 8601)
         */
        created_at: string;
        /**
         * Время обновления (ISO 8601)
         */
        updated_at: string;
    }>;
    total: number;
    limit: number;
    offset: number;
};

