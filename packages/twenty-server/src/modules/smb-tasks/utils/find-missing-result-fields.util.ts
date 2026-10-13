import { type ResultForm } from 'src/modules/smb-tasks/types/result-form.type';

const isEmptyValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '');

// Обязательные поля формы, не заполненные в результате. `false` для boolean —
// заполненное значение; пустая строка и null — нет.
export const findMissingResultFields = ({
  form,
  values,
}: {
  form: ResultForm;
  values: Record<string, unknown> | null | undefined;
}): { key: string; label: string }[] =>
  form.fields
    .filter((field) => field.required)
    .filter((field) => isEmptyValue(values?.[field.key]))
    .map((field) => ({ key: field.key, label: field.label }));
