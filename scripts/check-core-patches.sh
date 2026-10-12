#!/usr/bin/env bash
# Сверяет правки ядра (вне наших каталогов) с реестром docs/PATCHES.md.
# Файл изменён, но не записан в реестре → exit 1, CI падает.
#
#   bash scripts/check-core-patches.sh           # diff BASE...HEAD (CI)
#   bash scripts/check-core-patches.sh --staged  # staged files (pre-commit)
set -euo pipefail

BASE="${UPSTREAM_BASE_REF:-upstream-base}"
REGISTRY="docs/PATCHES.md"
STAGED=false

for arg in "$@"; do
  case "$arg" in
    --staged) STAGED=true ;;
    -h|--help)
      echo "Usage: bash scripts/check-core-patches.sh [--staged]"
      exit 0
      ;;
    *)
      echo "check-core-patches: неизвестный аргумент: $arg" >&2
      exit 2
      ;;
  esac
done

# Путь требует записи в docs/PATCHES.md, если (статус != A) ИЛИ (статус == A
# и путь вне OURS). Статус-зависимое правило закрывает и широкие '^\.github/',
# и '^\.claude/': правка upstream-файла ловится по статусу M/D независимо от
# каталога, а добавляемый нами новый код — по A + OURS.
#
# OURS = только наш новодобавленный код:
#   packages/smb-*, apps/, docs/, scripts/, smb/, .claude/, .cursor/,
#   .github/workflows/fork-*  — но НЕ весь '.github/' (upstream CI мы правим).
# i18n отдельно: *.po и locales/generated/* перегенерируются пайплайном и не
# коммитятся (docs/PATCHES.md) — для них запись в реестр не предусмотрена,
# иначе гейт упирался бы в правило, которого нельзя придержаться.
# M2 (решение владельца 2026-10-09): код фронта/скина живёт в каталогах
# packages/twenty-front/src/modules/smb-*.
# M1 (решение владельца 2026-10-12, ADR-009 п.4): серверная часть модулей —
# packages/twenty-server/src/modules/smb-*, каталоги App — packages/twenty-apps/smb/.
# Расширение OURS ушло отдельным коммитом с bats-кейсами (TODO M-1).
# Паттерн точный (smb-[a-z0-9-]+): каталоги upstream-модулей
# twenty-server/src/modules/* в OURS не входят.
OURS='(^|/)locales/(generated/|.*\.po$)|^(packages/smb-|apps/|docs/|scripts/|smb/|\.claude/|\.cursor/|\.github/workflows/fork-|packages/twenty-front/src/modules/smb-[a-z0-9-]+/|packages/twenty-server/src/modules/smb-[a-z0-9-]+/|packages/twenty-apps/smb/)'

# core.quotepath=false: иначе git оборачивает пути с не-ASCII (кириллица в
# docs/bitrix-audit/, docs/tooling/) в двойные кавычки, '^docs/' не матчится,
# и check-core-patches падает на собственных доках форка.
#
# Оба режима сравниваются ОТ БАЗЫ — иначе статусы расходятся с правилом:
#   * diff BASE..HEAD      — база -> HEAD;
#   * --cached  (pre-commit)— база -> ИНДЕКС (а не HEAD -> индекс, иначе любой
#     наш уже закоммиченный файл читается как M и ложно требует записи).
# --no-renames: переименование читается как D+A и не прячет правку ядра.
if ! git rev-parse --verify --quiet "$BASE" >/dev/null; then
  if git rev-parse --verify --quiet "origin/$BASE" >/dev/null; then
    BASE="origin/$BASE"
  else
    echo "check-core-patches: не найден базовый реф '$BASE' (настройка UPSTREAM_BASE_REF)" >&2
    exit 2
  fi
fi

git_pairs() {
  if [ "$STAGED" = true ]; then
    git -c core.quotepath=false diff --cached --name-status --no-renames "$BASE"
  else
    git -c core.quotepath=false diff --name-status --no-renames "$BASE" HEAD
  fi
}

if [ "$STAGED" = true ]; then
  DIFF_DESC="staged (base=$BASE -> index)"
else
  DIFF_DESC="diff $BASE...HEAD"
fi

[ -f "$REGISTRY" ] || { echo "check-core-patches: нет реестра $REGISTRY" >&2; exit 2; }

# Требуют записи: всё, кроме (A + путь в OURS).
# || true в конце обязателен: при пустой выборке grep/sort возвращают 1, а
# set -e + pipefail убивали скрипт ДО echo — режим --staged молча завершался
# с exit 1 без вывода.
changed=$(
  git_pairs | {
    while IFS="$(printf '\t')" read -r st path; do
      [ -z "${path:-}" ] && continue
      if [ "$st" = "A" ] && [[ "$path" =~ $OURS ]]; then continue; fi
      printf '%s\n' "$path"
    done || true
  } | sort -u || true
)

if [ -z "$changed" ]; then
  echo "OK: правок ядра нет ($DIFF_DESC в не-наших каталогах пуст)."
  exit 0
fi

# 3-й столбец таблицы реестра = путь файла (точный путь, glob, или каталог с / на конце);
# при разбиении на | первый элемент пустой (ведущая |), поэтому ID=$2, Файл=$3
registered=$(awk -F'|' '
  /^\|/ && NF >= 6 {
    entry = $3
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", entry)
    if (entry != "" && entry != "Файл" && entry !~ /^-+$/) print entry
  }' "$REGISTRY")

# Next free P-NNN for the fix hint
next_id=$(awk -F'|' '
  /^\|/ && NF >= 6 {
    id = $2
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", id)
    if (id ~ /^P-[0-9]+$/) {
      n = substr(id, 3) + 0
      if (n > max) max = n
    }
  }
  END { printf "P-%03d", max + 1 }
' "$REGISTRY")

missing=()
while IFS= read -r file; do
  if [ -z "$file" ]; then continue; fi
  found=0
  while IFS= read -r entry; do
    if [ -z "$entry" ]; then continue; fi
    # правая часть == — намеренно glob-сравнение, а не равенство строк
    if [[ "$file" == "$entry" || "$file" == $entry || ( "$entry" == */ && "$file" == "$entry"* ) ]]; then
      found=1
      break
    fi
  done <<< "$registered"
  if [ "$found" -eq 0 ]; then missing+=("$file"); fi
done <<< "$changed"

if [ ${#missing[@]} -gt 0 ]; then
  echo "Нет в $REGISTRY:"
  printf '%s\n' "${missing[@]}"
  echo ""
  echo "Как исправить:"
  echo "  1. Добавь строку ${next_id} (или следующий свободный ID) в $REGISTRY для каждого файла."
  echo "  2. Формат: | ${next_id} | <путь> | Что изменено | Зачем | Можно в upstream? | Риск |"
  echo "  3. Правка ядра >1 строки — плюс ADR в docs/adr/ (см. docs/PATCHES.md)."
  echo "Пример:"
  echo "  | ${next_id} | ${missing[0]} | краткое описание | зачем | нет | средний |"
  exit 1
fi

echo "OK: все правки ядра записаны в $REGISTRY."
