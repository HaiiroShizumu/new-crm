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

# Наши каталоги (новый код форка) + исключения i18n:
# *.po и locales/generated/* перегенерируются пайплайном и не коммитятся,
# если задача не про переводы.
OURS='^(packages/smb-|apps/|docs/|scripts/|smb/|\.github/|\.gitlab-ci|\.claude/|\.cursor/)|(^|/)locales/.*\.po$|(^|/)locales/generated/'

if [ "$STAGED" = true ]; then
  changed=$(git diff --cached --name-only --diff-filter=ACMR | grep -Ev "$OURS" | grep -v '^$' | sort -u || true)
  DIFF_DESC="staged"
else
  if ! git rev-parse --verify --quiet "$BASE" >/dev/null; then
    if git rev-parse --verify --quiet "origin/$BASE" >/dev/null; then
      BASE="origin/$BASE"
    else
      echo "check-core-patches: не найден базовый реф '$BASE' (настройка UPSTREAM_BASE_REF)" >&2
      exit 2
    fi
  fi
  changed=$(git diff --name-only "$BASE"...HEAD | grep -Ev "$OURS" | grep -v '^$' | sort -u || true)
  DIFF_DESC="diff $BASE...HEAD"
fi

[ -f "$REGISTRY" ] || { echo "check-core-patches: нет реестра $REGISTRY" >&2; exit 2; }

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
