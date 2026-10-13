import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';

import { SMB_MODULE_KEY_METADATA } from 'src/modules/smb-modules/constants/smb-module-key-metadata.constant';
import { SmbModuleGuard } from 'src/modules/smb-modules/guards/smb-module.guard';

// Серверная половина правила «модуль включён = App установлен» (ADR-009 п.3).
// Вешается на резолверы и контроллеры модуля; чужие обработчики не трогает —
// без метаданных guard пропускает запрос. Реализация M-4.
export const RequireSmbModule = (
  moduleKey: string,
): MethodDecorator & ClassDecorator =>
  applyDecorators(
    SetMetadata(SMB_MODULE_KEY_METADATA, moduleKey),
    UseGuards(SmbModuleGuard),
  );
