import {
  ForbiddenException,
  Optional,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isDefined } from 'twenty-shared/utils';

import { SMB_MODULE_KEY_METADATA } from 'src/modules/smb-modules/constants/smb-module-key-metadata.constant';
import { getSmbServerModuleManifestByKey } from 'src/modules/smb-modules/registry';
import { SmbInstalledApplicationsCacheService } from 'src/modules/smb-modules/services/smb-installed-applications-cache.service';
import { getRequest } from 'src/utils/extract-request';

// Guard для @RequireSmbModule (M-4): пропускает запрос, только если App
// модуля установлен в компании (ADR-009 п.3) — по кэшу, а не по живому SELECT.
// Без метаданных (чужой резолвер/контроллер) пропускает всё.
@Injectable()
export class SmbModuleGuard {
  constructor(
    private readonly reflector: Reflector,
    // Опционально: если SmbServerModule не подключён (шов P-002), guard
    // отказывает с внятной ошибкой, а не пропускает запрос молча.
    @Optional()
    private readonly installedApplicationsCache?: SmbInstalledApplicationsCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleKey = this.reflector.getAllAndOverride<string | undefined>(
      SMB_MODULE_KEY_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!isDefined(moduleKey)) {
      return true;
    }

    if (!isDefined(this.installedApplicationsCache)) {
      throw new ForbiddenException(
        `Модуль '${moduleKey}' закрыт guard'ом @RequireSmbModule, но SmbServerModule не подключён к ядру (шов P-002): проверить, установлен ли App, нельзя.`,
      );
    }

    const manifest = getSmbServerModuleManifestByKey(moduleKey);

    if (!isDefined(manifest)) {
      throw new ForbiddenException(
        `Модуль '${moduleKey}' не зарегистрирован в src/modules/smb-modules/registry.ts: строку добавляет генератор yarn smb:module new.`,
      );
    }

    const request = getRequest(context);
    const workspaceId = request?.workspaceId ?? request?.workspace?.id;

    if (!isDefined(workspaceId)) {
      throw new ForbiddenException(
        `Модуль '${moduleKey}': запрос пришёл без контекста компании — модуль не считается включённым.`,
      );
    }

    const isModuleEnabled =
      await this.installedApplicationsCache.isModuleEnabled({
        workspaceId,
        universalIdentifier: manifest.applicationUniversalIdentifier,
      });

    if (!isModuleEnabled) {
      throw new ForbiddenException(
        `Модуль '${moduleKey}' выключен в этой компании: его App не установлен или установка не завершена (ADR-009 п.3).`,
      );
    }

    return true;
  }
}
