#!/usr/bin/env bash
# verify-citations.sh — механическая проверка ссылок из baseline и ADR на базе форка
# Вывод: docs/arch/02-citations.csv
# Колонки: citation, doc, exists_base, line_in_range, exists_main, status
# status ∈ OK|MISSING_IN_BASE|LINE_DRIFT|AMBIGUOUS

set -uo pipefail

BASE_TAG="twenty/v2.45.6"
MAIN_BRANCH="upstream/main"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_CSV="$REPO_ROOT/docs/arch/02-citations.csv"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

CITATIONS_FILE="$TMP_DIR/citations_raw.txt"
BASE_FILES_LIST="$TMP_DIR/base_files.txt"
MAIN_FILES_LIST="$TMP_DIR/main_files.txt"
> "$CITATIONS_FILE"

echo "=== Сбор ссылок из docs/arch/00-baseline-analysis.md и docs/adr/*.md ==="

extract_citations() {
  local file="$1"
  local doc_name="$2"
  # path:line и path:from-to; расширения из ТЗ
  perl -ne '
    while (/([A-Za-z0-9_.\/@-]+\.(?:ts|tsx|mdx|scss|css|json|yml)):(\d+)(?:-(\d+))?/g) {
      my $path = $1;
      my $start = $2;
      my $end = defined $3 ? $3 : $2;
      print "'"$doc_name"'\t$path\t$start\t$end\n";
    }
  ' "$file" >> "$CITATIONS_FILE"
}

extract_citations "$REPO_ROOT/docs/arch/00-baseline-analysis.md" "baseline"
for adr in "$REPO_ROOT"/docs/adr/ADR-*.md; do
  [ -f "$adr" ] || continue
  extract_citations "$adr" "$(basename "$adr" .md)"
done

TOTAL=$(wc -l < "$CITATIONS_FILE" | tr -d ' ')
echo "Всего ссылок найдено: $TOTAL"

echo "=== Индексация деревьев $BASE_TAG и $MAIN_BRANCH ==="
git -C "$REPO_ROOT" ls-tree -r --name-only "$BASE_TAG" > "$BASE_FILES_LIST"
if git -C "$REPO_ROOT" rev-parse --verify --quiet "$MAIN_BRANCH" >/dev/null 2>&1; then
  git -C "$REPO_ROOT" ls-tree -r --name-only "$MAIN_BRANCH" > "$MAIN_FILES_LIST"
else
  echo "WARN: $MAIN_BRANCH не найден — exists_main будет UNKNOWN" >&2
  > "$MAIN_FILES_LIST"
fi

echo "citation,doc,exists_base,line_in_range,exists_main,status" > "$OUTPUT_CSV"

file_exists_in_ref() {
  local ref="$1"
  local path="$2"
  git -C "$REPO_ROOT" cat-file -e "$ref:$path" 2>/dev/null
}

line_count_in_ref() {
  local ref="$1"
  local path="$2"
  git -C "$REPO_ROOT" show "$ref:$path" 2>/dev/null | wc -l | tr -d ' '
}

# Сокращённый/относительный путь → кандидаты в base tree
resolve_path_candidates() {
  local path="$1"
  local list="$2"

  if [[ "$path" == packages/* ]] || [[ "$path" == apps/* ]]; then
    if grep -Fxq "$path" "$list" 2>/dev/null; then
      echo "$path"
      return
    fi
  fi

  # .../foo/bar.ts → суффикс foo/bar.ts
  local suffix="${path#.../}"
  suffix="${suffix#./}"

  # точное совпадение хвоста
  local matches
  matches=$(grep -E "/${suffix}$|^${suffix}$" "$list" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "$matches"
    return
  fi

  # только basename (basename -- — чтобы пути вроде -group.entity.ts не считались опцией)
  local base
  base=$(basename -- "$suffix")
  grep -E "/${base}$|^${base}$" "$list" 2>/dev/null || true
}

process_one() {
  local doc="$1"
  local path="$2"
  local start_line="$3"
  local end_line="$4"

  local citation="${path}:${start_line}"
  [ "$start_line" != "$end_line" ] && citation="${citation}-${end_line}"

  local candidates
  candidates=$(resolve_path_candidates "$path" "$BASE_FILES_LIST")
  local n
  n=$(printf '%s\n' "$candidates" | grep -c . || true)

  local exists_base="MISSING"
  local line_in_range="0"
  local exists_main="MISSING"
  local status="MISSING_IN_BASE"
  local resolved=""

  if [ "$n" -eq 0 ]; then
    # нет в base — проверить main по тому же basename/суффиксу
    local main_cands
    main_cands=$(resolve_path_candidates "$path" "$MAIN_FILES_LIST")
    local mn
    mn=$(printf '%s\n' "$main_cands" | grep -c . || true)
    if [ "$mn" -gt 0 ]; then
      exists_main="EXISTS"
    fi
    status="MISSING_IN_BASE"
  elif [ "$n" -gt 1 ]; then
    exists_base="AMBIGUOUS"
    exists_main="AMBIGUOUS"
    status="AMBIGUOUS"
  else
    resolved=$(printf '%s\n' "$candidates" | head -1)
    exists_base="EXISTS"
    local lc
    lc=$(line_count_in_ref "$BASE_TAG" "$resolved")
    if [ "$start_line" -le "$lc" ] && [ "$end_line" -le "$lc" ] && [ "$start_line" -ge 1 ]; then
      line_in_range="1"
      status="OK"
    else
      line_in_range="0"
      status="LINE_DRIFT"
    fi
    if file_exists_in_ref "$MAIN_BRANCH" "$resolved"; then
      exists_main="EXISTS"
    else
      # путь мог смениться на main — ищем по basename
      local main_cands2
      main_cands2=$(resolve_path_candidates "$resolved" "$MAIN_FILES_LIST")
      local mn2
      mn2=$(printf '%s\n' "$main_cands2" | grep -c . || true)
      if [ "$mn2" -gt 0 ]; then
        exists_main="EXISTS"
      else
        exists_main="MISSING"
      fi
    fi
  fi

  echo "$citation,$doc,$exists_base,$line_in_range,$exists_main,$status" >> "$OUTPUT_CSV"
}

echo "=== Проверка ссылок ==="
processed=0
while IFS=$'\t' read -r doc path start_line end_line; do
  [ -z "${path:-}" ] && continue
  process_one "$doc" "$path" "$start_line" "$end_line"
  processed=$((processed + 1))
  if (( processed % 50 == 0 )); then
    echo "  … $processed / $TOTAL"
  fi
done < "$CITATIONS_FILE"

echo "=== Готово: $processed ссылок → $OUTPUT_CSV ==="
echo "Сводка:"
awk -F',' 'NR>1 {c[$6]++} END {for (s in c) printf "  %s: %d\n", s, c[s]}' "$OUTPUT_CSV" | sort
