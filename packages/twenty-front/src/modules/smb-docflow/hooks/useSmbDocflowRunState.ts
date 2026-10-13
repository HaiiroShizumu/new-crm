import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type WorkflowRun } from '@/workflow/types/Workflow';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { workflowRunSchema } from 'twenty-shared/workflow';

// Штатный useWorkflowRun не подходит: он бросает исключение, когда состояние
// запуска не проходит схему (R15, «Разбор блока C»), и тянет запись целиком.
// Здесь читаются только id, status и state, а схема проверяется через safeParse,
// как в useSmbDocflowTasks — сломавшийся запуск не должен ронять предпросмотр.
export const useSmbDocflowRunState = (
  workflowRunId: string,
): WorkflowRun['state'] | undefined => {
  const { record } = useFindOneRecord({
    objectNameSingular: CoreObjectNameSingular.WorkflowRun,
    objectRecordId: workflowRunId,
    recordGqlFields: { id: true, status: true, state: true },
  });

  if (!isDefined(record)) {
    return undefined;
  }

  const parsedWorkflowRun = workflowRunSchema.safeParse(record);

  return parsedWorkflowRun.success ? parsedWorkflowRun.data.state : undefined;
};
