/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TaskCreateDtoClass = {
    /**
     * Название задачи
     */
    name: string;
    /**
     * Описание задачи (необязательно)
     */
    description?: (string | null);
    /**
     * Подсказка/шаблон запроса для ИИ
     */
    prompt: string;
};

