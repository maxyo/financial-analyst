/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TaskDtoClass_Output = {
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
    createdAt: string;
    /**
     * Время обновления (ISO 8601)
     */
    updatedAt: string;
};

