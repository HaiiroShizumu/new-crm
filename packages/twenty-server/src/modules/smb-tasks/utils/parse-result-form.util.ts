import { isDefined } from 'twenty-shared/utils';

import {
  RESULT_FORM_FIELD_TYPES,
  type ResultForm,
  type ResultFormField,
  type ResultFormFieldType,
} from 'src/modules/smb-tasks/types/result-form.type';

export type ParseResultFormResult =
  | { isValid: true; form: ResultForm }
  | { isValid: false; errors: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const FIELD_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

// Контракт формата формы (T-9): всё, что не подходит, возвращается списком
// ошибок, а не молча отбрасывается.
export const parseResultForm = (raw: unknown): ParseResultFormResult => {
  if (!isRecord(raw)) {
    return { isValid: false, errors: ['Форма должна быть объектом.'] };
  }

  if (raw.version !== 1) {
    return { isValid: false, errors: ['Поддерживается только version = 1.'] };
  }

  if (!Array.isArray(raw.fields)) {
    return { isValid: false, errors: ['fields должен быть массивом.'] };
  }

  const errors: string[] = [];
  const fields: ResultFormField[] = [];
  const seenKeys = new Set<string>();

  raw.fields.forEach((rawField: unknown, index: number) => {
    const where = `fields[${index}]`;

    if (!isRecord(rawField)) {
      errors.push(`${where}: поле должно быть объектом.`);

      return;
    }

    const { key, label, type, required, options } = rawField;

    if (typeof key !== 'string' || !FIELD_KEY_PATTERN.test(key)) {
      errors.push(`${where}: key — латиница, цифры и _, начинается с буквы.`);

      return;
    }

    if (seenKeys.has(key)) {
      errors.push(`${where}: key «${key}» повторяется.`);

      return;
    }

    seenKeys.add(key);

    if (typeof label !== 'string' || label.trim() === '') {
      errors.push(`${where}: у «${key}» нет label.`);
    }

    if (
      typeof type !== 'string' ||
      !(RESULT_FORM_FIELD_TYPES as readonly string[]).includes(type)
    ) {
      errors.push(`${where}: у «${key}» неизвестный type.`);

      return;
    }

    if (
      type === 'select' &&
      !(
        Array.isArray(options) &&
        options.length > 0 &&
        options.every((option) => typeof option === 'string')
      )
    ) {
      errors.push(`${where}: у select «${key}» нужен непустой массив options.`);

      return;
    }

    fields.push({
      key,
      label: typeof label === 'string' ? label : key,
      type: type as ResultFormFieldType,
      required: required === true,
      ...(type === 'select' ? { options: options as string[] } : {}),
    });
  });

  return errors.length > 0
    ? { isValid: false, errors }
    : { isValid: true, form: { version: 1, fields } };
};

export const isResultFormDefined = (raw: unknown): boolean =>
  isDefined(raw) && !(isRecord(raw) && Object.keys(raw).length === 0);
