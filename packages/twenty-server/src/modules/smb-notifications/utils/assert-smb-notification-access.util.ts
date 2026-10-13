import { ForbiddenException } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

export type SmbNotificationAccessContext = {
  workspaceId: string;
  recipientId: string;
};

/**
 * Единственная функция проверки доступа к уведомлениям (ADR-010 п.2).
 *
 * Резолверы и `notify()` проходят только через неё: на выходе — пара
 * `(workspaceId, recipientId)`, обязательная для каждого запроса к таблице.
 * `workspaceMemberId` кладёт в request штатная авторизация под текущую
 * компанию, поэтому участник другой компании через проверку не пройдёт.
 */
export const assertSmbNotificationAccess = ({
  workspaceId,
  workspaceMemberId,
}: {
  workspaceId: string | undefined;
  workspaceMemberId: string | undefined;
}): SmbNotificationAccessContext => {
  if (!isNonEmptyString(workspaceId)) {
    throw new ForbiddenException(
      'Уведомления доступны только в контексте компании.',
    );
  }

  if (!isNonEmptyString(workspaceMemberId)) {
    throw new ForbiddenException(
      'Уведомления доступны только участнику компании: в запросе нет участника.',
    );
  }

  return { workspaceId, recipientId: workspaceMemberId };
};
