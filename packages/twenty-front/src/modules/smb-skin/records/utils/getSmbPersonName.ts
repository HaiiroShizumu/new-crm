import { isNonEmptyString } from '@sniptt/guards';
import { isPlainObject } from 'twenty-shared/utils';

// Works for both person and workspaceMember records, whose name is a
// { firstName, lastName } composite
export const getSmbPersonName = (record: unknown): string | null => {
  if (!isPlainObject(record) || !isPlainObject(record.name)) {
    return null;
  }

  const { firstName, lastName } = record.name;
  const fullName = [firstName, lastName]
    .filter((namePart) => isNonEmptyString(namePart))
    .join(' ');

  return isNonEmptyString(fullName) ? fullName : null;
};
