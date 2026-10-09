import { isString } from '@sniptt/guards';

import { type FieldMetadataItemOption } from '@/object-metadata/types/FieldMetadataItem';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

type FindSmbSelectOptionArgs = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  fieldName: string;
  value: unknown;
};

export const findSmbSelectOption = ({
  objectMetadataItem,
  fieldName,
  value,
}: FindSmbSelectOptionArgs): FieldMetadataItemOption | null => {
  if (!isString(value)) {
    return null;
  }

  const field = objectMetadataItem.fields.find(
    (fieldMetadataItem) => fieldMetadataItem.name === fieldName,
  );

  return field?.options?.find((option) => option.value === value) ?? null;
};
