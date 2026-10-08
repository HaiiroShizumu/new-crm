# UPSTREAM_BASE — базовая линия форка Twenty

Зафиксированная точка отсчёта ветки `main` форка. Каждое обновление с upstream сдвигает эту точку.

## Текущая база

| Параметр | Значение |
|---|---|
| Тег | `twenty/v2.45.6` |
| Коммит | `6007ad5a7f6cb676fd8a9ff0c2a86a2e3d4c260e` |
| Дата тега | 2026-10-05 14:02:54 +0200 |
| Удалённый источник | `https://github.com/twentyhq/twenty.git` (remote `upstream`) |
| Реф-база проверок | ветка `upstream-base` (равна тегу; `UPSTREAM_BASE_REF` для `scripts/check-core-patches.sh` и база `nx affected` в CI) |

Выбор тега: последний стабильный релиз без `alpha`/`beta`/`rc` в семействе `twenty/v2.*`
(теги вида `sdk/*` — релизы SDK, базой не берутся).

## Remotes

```bash
# уже настроено:
#   upstream  https://github.com/twentyhq/twenty.git  (fetch; push отключён: no_push)
#   origin    git@github.com:HaiiroShizumu/new-crm.git
#             https://github.com/HaiiroShizumu/new-crm
# ветки на origin: main, upstream-base
```

`upstream` — чистое зеркало: полная история и все теги (клон не shallow, теги не усечены).
Обновление зеркала: `git fetch upstream --tags`.

## Правило обновления (каждые 4–6 недель)

1. `git fetch upstream --tags`
2. Выбрать последний стабильный тег `twenty/vX.Y.Z` (без `alpha`/`beta`/`rc`).
3. `git branch update/upstream-<тег> main` и `git switch update/upstream-<тег>`
4. `git merge twenty/vX.Y.Z`
5. Разрешение конфликтов **только** по реестру `docs/PATCHES.md`: каждый конфликтный файл
   сверяется со своей строкой `P-XXX`; правка без строки в реестре — недопустима,
   CI (`check-core-patches`) упадёт.
6. Перенести реф-базу: `git branch -f upstream-base twenty/vX.Y.Z`
7. Полный CI (все стадии `fork-ci.yaml`) — зелёный до слияния в `main`.
8. Обновить эту таблицу (тег/коммит/дата) в том же коммите.

После слияния: `git switch main && git merge --no-ff update/upstream-<тег>`.

## Защита ветки (настройка GitHub-репозитория форка, не код)

`Settings → Branches → main → Branch protection rules`:

- Require a pull request before merging
- Require status checks to pass before merging → добавить:
  `check-core-patches`, `typecheck`, `lint`, `unit`, `integration`, `docker`

Красный CI блокирует MR/PR в `main`.

Upstream-workflow'ы (`.github/workflows/ci-*.yaml` и др.) остаются в репозитории и могут
запускаться в форке — при необходимости отключите ненужные в `Actions → Workflow`.

## Связанные файлы

- `docs/PATCHES.md` — реестр правок ядра
- `scripts/check-core-patches.sh` — CI-проверка реестра
- `.github/workflows/fork-ci.yaml` — стадии CI
