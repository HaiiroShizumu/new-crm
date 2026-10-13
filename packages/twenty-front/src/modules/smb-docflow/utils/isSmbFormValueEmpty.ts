import { isNonEmptyString, isObject } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

// A record picker answers with { id }, a multi-select with an array.
export const isSmbFormValueEmpty = (value: unknown): boolean => {
  if (!isDefined(value)) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (isObject(value) && 'id' in value) {
    return !isNonEmptyString(value.id);
  }

  return false;
};
