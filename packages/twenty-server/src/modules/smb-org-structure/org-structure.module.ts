import { Module } from '@nestjs/common';

import {
  DepartmentUpdateManyCyclePreQueryHook,
  DepartmentUpdateOneCyclePreQueryHook,
} from 'src/modules/smb-org-structure/hooks/department-cycle.pre-query.hook';
import { SmbOrgStructureService } from 'src/modules/smb-org-structure/services/smb-org-structure.service';

// Серверная часть модуля 'org-structure' (ADR-009 п.1): сервис «кто
// руководитель» для процессов и отсутствий (G-3) и PRE-хуки дерева отделов
// (G-4). Данных своих таблиц нет — отделы живут в App как объект Twenty.
@Module({
  providers: [
    SmbOrgStructureService,
    DepartmentUpdateOneCyclePreQueryHook,
    DepartmentUpdateManyCyclePreQueryHook,
  ],
  exports: [SmbOrgStructureService],
})
export class SmbOrgStructureModule {}
