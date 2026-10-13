// Предел глубины подъёма по дереву: защита от цикла, который уже попал в
// данные (импорт, прямая запись в БД), и от зависания обхода.
export const ORG_STRUCTURE_MAX_DEPTH = 64;

export const DEPARTMENT_OBJECT_NAME = 'department';
export const WORKSPACE_MEMBER_OBJECT_NAME = 'workspaceMember';
