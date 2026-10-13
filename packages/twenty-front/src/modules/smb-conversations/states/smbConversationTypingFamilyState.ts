import { createAtomFamilyState } from '@/ui/utilities/state/jotai/utils/createAtomFamilyState';

// workspaceMemberId -> timestamp of their last "typing" signal, per conversation.
export const smbConversationTypingFamilyState = createAtomFamilyState<
  Record<string, number>,
  string
>({
  key: 'smbConversationTypingFamilyState',
  defaultValue: {},
});
