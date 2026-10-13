import { registerEnumType } from '@nestjs/graphql';

// ADR-010 п.1. Сейчас создаются TEXT и SYSTEM; VOICE, FILE и CALL объявлены
// заранее по той же причине, что и виды бесед.
export enum SmbConversationMessageKind {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  CALL = 'CALL',
}

registerEnumType(SmbConversationMessageKind, {
  name: 'SmbConversationMessageKind',
});
