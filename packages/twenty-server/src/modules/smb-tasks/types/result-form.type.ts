// Формат формы результата задачи — «настройки шага FORM» (ADR-011, T-9).
// Один формат на запуск процесса, шаг процесса и результат задачи.
export const RESULT_FORM_FIELD_TYPES = [
  'text',
  'number',
  'boolean',
  'select',
  'date',
] as const;

export type ResultFormFieldType = (typeof RESULT_FORM_FIELD_TYPES)[number];

export type ResultFormField = {
  key: string;
  label: string;
  type: ResultFormFieldType;
  required: boolean;
  // Только для type = 'select'.
  options?: string[];
};

export type ResultForm = {
  version: 1;
  fields: ResultFormField[];
};
