import { isNonEmptyString, isString } from '@sniptt/guards';
import { isPlainObject } from 'twenty-shared/utils';
import { Avatar, type AvatarSize } from 'twenty-ui/primitives/data-display';

import { getSmbPersonName } from '@/smb-skin/records/utils/getSmbPersonName';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

type SmbRecordPersonAvatarProps = {
  person: unknown;
  size?: AvatarSize;
};

export const SmbRecordPersonAvatar = ({
  person,
  size = 'sm',
}: SmbRecordPersonAvatarProps) => {
  const name = getSmbPersonName(person);

  if (!isPlainObject(person) || name === null) {
    return null;
  }

  const avatarUrl = isNonEmptyString(person.avatarUrl)
    ? getAbsoluteImageUrl(person.avatarUrl)
    : null;

  return (
    <Avatar
      shape="circle"
      size={size}
      src={avatarUrl}
      name={name}
      colorSeed={isString(person.id) ? person.id : name}
      title={name}
    />
  );
};
