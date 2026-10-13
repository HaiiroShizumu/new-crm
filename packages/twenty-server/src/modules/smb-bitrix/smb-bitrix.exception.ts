import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { assertUnreachable } from 'twenty-shared/utils';

import { CustomException } from 'src/utils/custom-exception';

export enum SmbBitrixExceptionCode {
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  PORTAL_PROOF_FAILED = 'PORTAL_PROOF_FAILED',
  PORTAL_REQUEST_FAILED = 'PORTAL_REQUEST_FAILED',
  ADMIN_REQUIRED = 'ADMIN_REQUIRED',
  PORTAL_NOT_INSTALLED = 'PORTAL_NOT_INSTALLED',
  PORTAL_NOT_ACTIVE = 'PORTAL_NOT_ACTIVE',
  EMAIL_MISSING = 'EMAIL_MISSING',
  ACCOUNT_LINK_REQUIRED = 'ACCOUNT_LINK_REQUIRED',
  NOT_A_BITRIX_USER = 'NOT_A_BITRIX_USER',
}

const getSmbBitrixExceptionUserFriendlyMessage = (
  code: SmbBitrixExceptionCode,
): MessageDescriptor => {
  switch (code) {
    case SmbBitrixExceptionCode.NOT_CONFIGURED:
      return msg`The Bitrix24 integration is not configured on this server.`;
    case SmbBitrixExceptionCode.INVALID_REQUEST:
      return msg`This page must be opened from Bitrix24.`;
    case SmbBitrixExceptionCode.PORTAL_PROOF_FAILED:
      return msg`Bitrix24 did not confirm this request. Reopen the application.`;
    case SmbBitrixExceptionCode.PORTAL_REQUEST_FAILED:
      return msg`Bitrix24 is not responding. Try again in a minute.`;
    case SmbBitrixExceptionCode.ADMIN_REQUIRED:
      return msg`Only a Bitrix24 administrator can install the application.`;
    case SmbBitrixExceptionCode.PORTAL_NOT_INSTALLED:
      return msg`The application is not installed on this Bitrix24. Ask an administrator to install it.`;
    case SmbBitrixExceptionCode.PORTAL_NOT_ACTIVE:
      return msg`The application is installed and is waiting for activation.`;
    case SmbBitrixExceptionCode.EMAIL_MISSING:
      return msg`Your Bitrix24 profile has no email. Add one and reopen the application.`;
    case SmbBitrixExceptionCode.ACCOUNT_LINK_REQUIRED:
      return msg`An account with your email already exists. Ask your administrator to link it.`;
    case SmbBitrixExceptionCode.NOT_A_BITRIX_USER:
      return msg`This account is not linked to Bitrix24.`;
    default:
      assertUnreachable(code);
  }
};

export class SmbBitrixException extends CustomException<SmbBitrixExceptionCode> {
  constructor(
    message: string,
    code: SmbBitrixExceptionCode,
    { userFriendlyMessage }: { userFriendlyMessage?: MessageDescriptor } = {},
  ) {
    super(message, code, {
      userFriendlyMessage:
        userFriendlyMessage ?? getSmbBitrixExceptionUserFriendlyMessage(code),
    });
  }
}
