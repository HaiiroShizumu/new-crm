import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';

// Перенос сотрудника между отделами (G-2). Правка идёт штатным обновлением
// записи участника, поэтому права и PRE-хуки сервера действуют как обычно.
export const useMoveMemberToDepartment = () => {
  const { updateOneRecord } = useUpdateOneRecord();

  return async ({
    memberId,
    departmentId,
  }: {
    memberId: string;
    departmentId: string | null;
  }) => {
    await updateOneRecord({
      objectNameSingular: 'workspaceMember',
      idToUpdate: memberId,
      updateOneRecordInput: { departmentId },
    });
  };
};
