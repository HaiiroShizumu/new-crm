import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiPath } from 'twenty-shared/types';

import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import {
  readSmbModulesHealth,
  type SmbModulesHealth,
} from 'src/modules/smb-modules/utils/smb-modules-version-status';

// Сверка «версия App ↔ код образа» (M-7). Отдельный маршрут вместо правки
// штатного HealthController: так файл ядра остаётся upstream (AR-8).
@Controller(`${ApiPath.Health}/smb`)
export class SmbHealthController {
  @Get()
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  check(): SmbModulesHealth {
    return readSmbModulesHealth();
  }
}
