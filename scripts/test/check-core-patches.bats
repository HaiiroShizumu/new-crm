#!/usr/bin/env bats
# Тест гейта check-core-patches (правило A1 из задания R03):
#   путь требует записи в docs/PATCHES.md, если статус != A, либо статус == A
#   и путь ВНЕ OURS.
#
# Фикстура — отдельный git-репозиторий во временном каталоге из ДВУХ коммитов:
#   1) baseline = «upstream» (существующие файлы) -> ветка upstream-base;
#   2) HEAD = наш код (добавленные файлы, статус A относительно базы).
# Так diff база..HEAD отдаёт ровно те статусы, что и в реальном репозитории.
#
# Запуск:  TESTED_REPO=<корень двадцать-core> bats scripts/test/check-core-patches.bats
# Нужен:   git, bash, bats-core. Реальный репозиторий тест не трогает.
# Имена @test только на английском: bats не парсит кириллицу в именах.

setup() {
  REPO="$BATS_TEST_TMPDIR/repo"
  SRC="$BATS_TEST_TMPDIR/src"
  TESTED_REPO="${TESTED_REPO:-$PWD}"
  mkdir -p "$REPO" "$SRC/scripts" "$SRC/docs"

  # Гейт и реестр берутся из настоящего репозитория.
  cp "$TESTED_REPO/scripts/check-core-patches.sh" "$SRC/scripts/"
  printf '# PATCHES\n\n| ID | Файл | Что изменено | Зачем | Можно в upstream? | Риск |\n| --- | --- | --- | --- | --- | --- |\n' \
    > "$SRC/docs/PATCHES.md"

  # --- baseline «upstream» (станет upstream-base) ---
  UP="$REPO/.upstream"
  mkdir -p "$UP/.claude/skills/qa-scout" "$UP/.github/workflows" \
           "$UP/docs" "$UP/scripts" "$UP/packages/twenty-server/src" \
           "$UP/packages/twenty-front/src"
  echo '{"integrity":"upstream"}' > "$UP/.claude/settings.json"
  echo '# upstream skill'         > "$UP/.claude/skills/qa-scout/SKILL.md"
  echo 'name: ci-server'          > "$UP/.github/workflows/ci-server.yaml"
  echo '# upstream doc'           > "$UP/docs/upstream-guide.md"
  echo '#!/bin/sh'                > "$UP/scripts/upstream-tool.sh"
  echo 'export const core = 1;'   > "$UP/packages/twenty-server/src/core.ts"
  echo 'export const front = 1;'  > "$UP/packages/twenty-front/src/index.ts"
  # Файл в smb-skin, СУЩЕСТВУЮЩИЙ в базе: правка такого (даже в нашем каталоге)
  # всегда требует записи — правило «статус != A -> запись» не знает про OURS.
  mkdir -p "$UP/packages/twenty-front/src/modules/smb-skin"
  echo 'export const legacy = 1;' > "$UP/packages/twenty-front/src/modules/smb-skin/legacy-from-upstream.ts" 

  git -C "$REPO" init -q
  git -C "$REPO" config user.email test@example.com
  git -C "$REPO" config user.name test
  # baseline = только upstream-файлы, без нашего кода
  (cd "$REPO" && cp -R .upstream/. . && rm -rf .upstream && \
   git add -A && git commit -qm "upstream baseline")
  git -C "$REPO" branch -q upstream-base

  # --- наш код поверх базы (эти пути дадут статус A) ---
  # Только файлы ВНУТРИ OURS: любое добавление в packages/ уже потребует
  # записи (это проверяет кейс A2-5), поэтому в clean-состоянии его быть не должно.
  mkdir -p "$REPO/.claude/rules" "$REPO/.github/workflows"
  echo '# our rule'              > "$REPO/.claude/rules/ours.md"
  echo 'name: fork-x'            > "$REPO/.github/workflows/fork-x.yaml"
  cp -R "$SRC/." "$REPO/"
  git -C "$REPO" add -A
  git -C "$REPO" commit -qm "fork code"
}

# check <режим...>: гейт запускается ИЗ фикстуры (ищет docs/PATCHES.md от cwd);
# код возвращается через $status (bats).
check() {
  run bash -c "cd '$REPO' && bash scripts/check-core-patches.sh $*"
}

# add_row <path> — строка в реестр фикстуры
add_row() {
  printf '| P-001 | %s | тест | тест | нет | низкий |\n' "$1" >> "$REPO/docs/PATCHES.md"
}

@test "clean tree: both modes exit 0" {
  check --staged; [ "$status" -eq 0 ]
  check;          [ "$status" -eq 0 ]
}

@test "A2-1: modify upstream .github/workflows/ci-server.yaml -> exit 1" {
  echo '# tampered' >> "$REPO/.github/workflows/ci-server.yaml"
  git -C "$REPO" add .github/workflows/ci-server.yaml
  check --staged
  [ "$status" -eq 1 ]
  [[ "$output" == *".github/workflows/ci-server.yaml"* ]]
}

@test "A2-2: add new .github/workflows/fork-x.yaml -> exit 0 (A + OURS)" {
  echo '# changed' >> "$REPO/.github/workflows/fork-x.yaml"
  git -C "$REPO" add .github/workflows/fork-x.yaml
  check --staged
  [ "$status" -eq 0 ]
}

@test "A2-3: modify upstream .claude/settings.json -> exit 1" {
  echo '{"tampered":true}' > "$REPO/.claude/settings.json"
  git -C "$REPO" add .claude/settings.json
  check --staged
  [ "$status" -eq 1 ]
  [[ "$output" == *".claude/settings.json"* ]]
  [[ "$output" == *"Нет в docs/PATCHES.md"* ]]
}

@test "A2-4: delete upstream file under docs/ -> exit 1" {
  git -C "$REPO" rm -q docs/upstream-guide.md
  check --staged
  [ "$status" -eq 1 ]
  [[ "$output" == *"docs/upstream-guide.md"* ]]
}

@test "A2-5: add new file in packages/twenty-server/src -> exit 1 (A outside OURS)" {
  echo 'export const x = 1;' > "$REPO/packages/twenty-server/src/new-feature.ts"
  git -C "$REPO" add packages/twenty-server/src/new-feature.ts
  check --staged
  [ "$status" -eq 1 ]
  [[ "$output" == *"packages/twenty-server/src/new-feature.ts"* ]]
}

@test "A2-6: registry entry clears the error for that file" {
  echo 'export const x = 1;' > "$REPO/packages/twenty-server/src/new-feature.ts"
  git -C "$REPO" add packages/twenty-server/src/new-feature.ts
  check --staged; [ "$status" -eq 1 ]

  add_row "packages/twenty-server/src/new-feature.ts"
  git -C "$REPO" add docs/PATCHES.md
  check --staged
  [ "$status" -eq 0 ]
}

@test "our own file inside .claude/ (rules) -> exit 0 (A + OURS)" {
  echo '# changed' >> "$REPO/.claude/rules/ours.md"
  git -C "$REPO" add .claude/rules/ours.md
  check --staged
  [ "$status" -eq 0 ]
}

@test "modify our own docs/PATCHES.md stays A vs base -> exit 0" {
  add_row "docs/whatever.md"
  git -C "$REPO" add docs/PATCHES.md
  check --staged
  [ "$status" -eq 0 ]
}

@test "modify upstream skill .claude/skills/qa-scout -> exit 1" {
  echo '# tampered' >> "$REPO/.claude/skills/qa-scout/SKILL.md"
  git -C "$REPO" add .claude/skills/qa-scout/SKILL.md
  check --staged
  [ "$status" -eq 1 ]
  [[ "$output" == *"qa-scout"* ]]
}

@test "modify upstream core file packages/twenty-server/src/core.ts -> exit 1" {
  echo 'export const core = 2;' > "$REPO/packages/twenty-server/src/core.ts"
  git -C "$REPO" add packages/twenty-server/src/core.ts
  check --staged
  [ "$status" -eq 1 ]
}

@test "modify upstream scripts/ file -> exit 1" {
  echo '# touched' >> "$REPO/scripts/upstream-tool.sh"
  git -C "$REPO" add scripts/upstream-tool.sh
  check --staged
  [ "$status" -eq 1 ]
  [[ "$output" == *"scripts/upstream-tool.sh"* ]]
}

# --- M2: OURS = ^packages/twenty-front/src/modules/smb-[a-z0-9-]+/ (владелец) ---

@test "M2-1: new file in smb-skin -> exit 0 (A + OURS)" {
  mkdir -p "$REPO/packages/twenty-front/src/modules/smb-skin/components"
  echo 'export const New = () => null;' > "$REPO/packages/twenty-front/src/modules/smb-skin/components/New.tsx"
  git -C "$REPO" add packages/twenty-front/src/modules/smb-skin/components/New.tsx
  check --staged
  [ "$status" -eq 0 ]
  [[ "$output" == *"правок ядра нет"* ]]
}

@test "M2-2: new file in object-record -> exit 1 (A outside OURS)" {
  mkdir -p "$REPO/packages/twenty-front/src/modules/object-record"
  echo 'export const x = 1;' > "$REPO/packages/twenty-front/src/modules/object-record/hotfix.ts"
  git -C "$REPO" add packages/twenty-front/src/modules/object-record/hotfix.ts
  check --staged
  [ "$status" -eq 1 ]
  [[ "$output" == *"object-record/hotfix.ts"* ]]
}

@test "M2-3: modify EXISTING file in smb-skin (present in base) -> exit 1" {
  # файл из baseline: статус M, OURS не помогает — «статус != A -> запись»
  echo 'export const legacy = 2;' > "$REPO/packages/twenty-front/src/modules/smb-skin/legacy-from-upstream.ts"
  git -C "$REPO" add packages/twenty-front/src/modules/smb-skin/legacy-from-upstream.ts
  check --staged
  [ "$status" -eq 1 ]
  [[ "$output" == *"smb-skin/legacy-from-upstream.ts"* ]]
}
