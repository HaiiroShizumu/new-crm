# ADR-005: Визуальный слой — токены против патчей компонентов

**Статус:** Предложено (утверждение за владельцем)
**Дата:** 2026-10-08
**Основание:** `docs/arch/00-baseline-analysis.md` §1f, §7.1 (п. 1)
**Связанные:** [ADR-001](ADR-001-module-mechanism.md) (швы и PATCHES.md), [ADR-006](ADR-006-module-activation-license.md)

---

## Контекст

Нужен фирменный вид (цвета, радиусы, шрифт, логотип, favicon/заголовок, копирайт) при минимальном количестве патчей ядра. Факты (§1f + досмотр):

**Токены:**

- `--t-*` CSS-переменные: `packages/twenty-ui/src/theme/theme-light.css` (≈1000 уникальных имён) и `theme-dark.css`; селектор `.light { … }` / `.dark { … }` — специфичность **(0,1,0)**, **`!important` нет ни одного** → внешний stylesheet легко переопределяет: достаточно `html.light { --t-… }` (специфичность 0,1,1), независимо от порядка загрузки.
- Файлы генерируются (`npx nx generateTokens twenty-ui`, шапка «Do not edit manually») — править их нельзя, только переопределять сверху.
- `ThemeProvider` принимает `overrides?: Record<string, string|number>` — inline-style scope (`ThemeProvider.tsx:112-124`), `useTheme()` перечитывает значения из computed style (`:61-73`). Но `BaseThemeProvider` во фронте overrides не пробрасывает (`BaseThemeProvider.tsx:31-37`) — из коробки настройка идёт внешним CSS.
- Компонентный слой **уже токенизирован**: 88 SCSS-модулей twenty-ui используют `var(--t-*)`, hex-хардкода в `*.module.scss`/`*.tsx` не найдено.

**Что токенами не покрывается:**

- логотип: `DefaultWorkspaceLogo.ts:1-2` (внешний URL), `auth/components/Logo.tsx:57-70` (origin-путь), онбординг-ассет (`OnboardingPulsingLogo.tsx:26`);
- favicon/title/og-meta: `packages/twenty-front/index.html:7-31` + динамический `PageFavicon.tsx:11-25` из `workspacePublicData.logo`;
- глобальный `body` хардкодит `'Inter', sans-serif` — `packages/twenty-front/src/index.css:3-11` (не через `var(--t-font-family)`);
- страница логина (структура/тексты) — `SignInUp*.tsx`.

**Churn (коммитов/6мес):** `twenty-ui/src/theme` 14, `ThemeProvider.tsx` 1, `design-tokens` 6 — токены стабильны; `auth` 107, `navigation-drawer` 64, `onboarding` 80, `Logo.tsx` 10, `index.css` 7, `index.html` 4, `page-favicon` 1.

## Варианты

### A. Только токены (без единого патча)

Внешний stylesheet с бренд-переопределениями `--t-*` + `html body { font-family }` (специфичность 0,0,2 перекрывает `body` из `index.css:5`); лого/favicon — через штатные workspace-настройки (logo workspace уже подхватывается `PageFavicon`).

### B. Патчи компонентов

Правка twenty-ui/twenty-front под бренд: лого, шрифты, страница логина, отдельные компоненты — максимальный контроль, максимальный churn.

### C. Токены как основа + закрытый список «разрешённых швов» (≤5 файлов ядра)

Всё, что выражается токенами — токенами; исключения — только из утверждённого списка, каждая правка = строка в `docs/PATCHES.md`.

## Критерии

| Критерий | A: только токены | B: патчи компонентов | C: токены + 5 швов |
|---|---|---|---|
| Охват брендинга | цвета/радиусы/шрифт компонентов — да; лого/favicon/title — частично через workspace-настройки | полный | полный |
| Патчи ядра | 0 | много, в зонах churn 64–107 | ≤5 файлов, churn 1–10 у четырёх из пяти |
| Конфликты при обновлении upstream | практически нет (тема стабильна: 14+1 коммит) | высокие (auth/navigation — топ по churn) | низкие/средние, контролируемы реестром |
| Скины/темы light/dark | да, обе таблицы `--t-*` | да | да |
| Стоимость | низкая | высокая | низкая + дисциплина |

## Решение (рекомендация)

**Вариант C — токены + ограниченный список швов.**

### Бренд-слой (без патчей)

1. Свой stylesheet `packages/smb-brand/brand.css` (наш каталог) с `html.light`/`html.dark`-переопределениями `--t-*` (цвета, `--t-font-family`, `--t-border-radius-*`); подключение — в наш слой фронта.
2. `html body { font-family: … }` — перекрывает хардкод `index.css:5` по специфичности, **шов `index.css` не обязателен** (остаётся резервным).
3. Учить `@supports (corner-shape: squircle)` в `theme-light.css:1038-1053` — блок добавляет радиусы поверх (иначе в Chromium радиусы «удвоятся»).
4. Если понадобится runtime-`overrides` в `BaseThemeProvider` — это отдельная минимальная правка (1 строка) с записью в `PATCHES.md`.

### Разрешённые швы (максимум 5 файлов ядра)

| # | Файл | Зачем | Churn/6мес |
|---|---|---|---|
| 1 | `packages/twenty-front/src/index.css` | хардкод `'Inter', sans-serif` на строке 5 — если CSS-override по специфичности покажется ненадёжным | 7 |
| 2 | `packages/twenty-front/index.html` | `<title>`, og/twitter-мета, favicon для не-авторизованного экрана — вне рантайм-темы | 4 |
| 3 | `packages/twenty-front/src/modules/ui/navigation/navigation-drawer/constants/DefaultWorkspaceLogo.ts` | дефолтный лого сайдбара — внешний URL twentyhq | низкий (константа) |
| 4 | `packages/twenty-front/src/modules/ui/utilities/page-favicon/components/PageFavicon.tsx` | фолбэк favicon, если у workspace нет logo | 1 |
| 5 | `packages/twenty-front/src/modules/auth/components/Logo.tsx` | лого на логине/сбросе пароля — токенов на бренд-арт нет | 10 |

Швы 3–5 закрываются альтернативой «загрузить свой ассет как logo workspace» (тогда правка не нужна) — список ниже как fallback, не как первый шаг.

## Последствия

- **Плюсы:** обновления upstream почти без конфликтов; токены — штатный, документированный механизм (`packages/twenty-docs/ui/theming.mdx`); смена бренда = правка одного CSS-файла; компонентный слой не трогаем вообще.
- **Минусы:** «глубокие» визуальные изменения (структура логина, свои иконки вместо канонических, layout сайдбара) токенами невозможны — потребуется либо принять штатный вид, либо новый шов сверх списка (только через ADR); генератор токенов может переименовать переменные при обновлении (регенерация + CI-проверка устаревания) — свой бренд-CSS придётся сверять.
- **Процессно:** список швов держать в этом ADR; расширение списка = ревизия ADR.

## Что нужно проверить прототипом

1. Подключить `brand.css` с 3–4 фирменными цветами и шрифтом — убедиться, что light и dark перекрываются полностью, `useTheme()` и Linaria-компоненты видят значения.
2. Радиусы: переопределить `--t-border-radius-md` — проверить отсутствие «двойного» радиуса из squircle-блока в Chromium.
3. Логотип: заменить URL в `DefaultWorkspaceLogo.ts` (шов 3) и подменить ассет — посчитать, какие экраны затронуты.
4. Шрифт: только `html body { font-family }` без правки `index.css` — весь UI использует новый шрифт? Если нет — активировать шов 1.
5. Обновление токенов: прогнать `npx nx generateTokens twenty-ui` — не изменились ли имена `--t-*`, которые переопределяет бренд-CSS.
