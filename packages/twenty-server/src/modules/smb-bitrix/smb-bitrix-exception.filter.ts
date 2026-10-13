import { Catch, type ExceptionFilter } from '@nestjs/common';

import { ForbiddenError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { SmbBitrixException } from 'src/modules/smb-bitrix/smb-bitrix.exception';

@Catch(SmbBitrixException)
export class SmbBitrixExceptionFilter implements ExceptionFilter {
  catch(exception: SmbBitrixException) {
    throw new ForbiddenError(exception);
  }
}
