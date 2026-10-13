export type TaskTemplateLike = {
  name?: string | null;
  description?: string | null;
  resultForm?: unknown;
  estimateMinutes?: number | null;
};

// T-5: поля новой задачи из шаблона. Форма копируется (глубоко), чтобы правка
// шаблона не меняла уже созданные задачи.
export const buildTaskFromTemplate = ({
  template,
  overrides = {},
}: {
  template: TaskTemplateLike;
  overrides?: { title?: string };
}) => ({
  title: overrides.title ?? template.name ?? '',
  resultForm:
    template.resultForm === undefined || template.resultForm === null
      ? null
      : JSON.parse(JSON.stringify(template.resultForm)),
  estimateMinutes: template.estimateMinutes ?? null,
});
