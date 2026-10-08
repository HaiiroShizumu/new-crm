#!/usr/bin/env bash
# Сверяет правки ядра (вне наших каталогов) с реестром docs/PATCHES.md.
# Файл изменён, но не записан в реестре → exit 1, CI падает.
set -euo pipefail

BASE="${UPSTREAM_BASE_REF:-upstream-base}"
REGISTRY="docs/PATCHES.md"

# Наши каталоги (новый код форка) + исключения i18n:
# *.po и locales/generated/* перегенериваются пайплайном и не коммитятся,
# если задача не про переводы.
OURS='^(packages/smb-|apps/|docs/|scripts/|smb/|\.github/|\.gitlab-ci)|(^|/)locales/.*\.po$|(^|/)locales/generated/'

if ! git rev-parse --verify --quiet "$BASE" >/dev/null; then
  if git rev-parse --verify --quiet "origin/$BASE" >/dev/null; then
    BASE="origin/$BASE"
  else
    echo "check-core-patches: не найден базовый реф '$BASE' (настройка UPSTREAM_BASE_REF)" >&2
    exit 2
  fi
fi
[ -f "$REGISTRY" ] || { echo "check-core-patches: нет реестра $REGISTRY" >&2; exit 2; }

changed=$(git diff --name-only "$BASE"...HEAD | grep -Ev "$OURS" | grep -v '^$' | sort -u || true)

if [ -z "$changed" ]; then
  echo "OK: правок ядра нет (diff $BASE...HEAD в не-наших каталогах пуст)."
  exit 0
fi

# 2-й столбец таблицы реестра = путь файла (точный путь, glob, или каталог с / на конце)
registered=$(awk -F'|' '
  /^\|/ && NF >= 5 {
    entry = $2
    gsub(/^[[:space:]]+|[[:space:]]+$/, "", entry)
    if (entry != "" && entry != "ID" && entry !~ /^-+$/) print entry
  }' "$REGISTRY")

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
  exit 1
fi

echo "OK: все правки ядра записаны в $REGISTRY."
