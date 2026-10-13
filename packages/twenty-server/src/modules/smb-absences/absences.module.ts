import { Module } from '@nestjs/common';

import {
  AbsenceCreateOneOverlapPreQueryHook,
  AbsenceUpdateOneOverlapPreQueryHook,
} from 'src/modules/smb-absences/hooks/absence-overlap.pre-query.hook';
import { SmbAbsencesService } from 'src/modules/smb-absences/services/smb-absences.service';

// Серверная часть модуля 'absences': запрет пересечения отсутствий одного
// сотрудника (A-3) и вопрос «отсутствует ли в день X» (A-5).
@Module({
  providers: [
    SmbAbsencesService,
    AbsenceCreateOneOverlapPreQueryHook,
    AbsenceUpdateOneOverlapPreQueryHook,
  ],
  exports: [SmbAbsencesService],
})
export class SmbAbsencesModule {}
