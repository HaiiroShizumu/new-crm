#!/usr/bin/env bats
# Тест гейта check-core-patches: правка upstream-файла внутри .claude/
# должна падать (exit 1) так же, как правка файлов вне наших каталогов.
#
# Фикстура — отдельный git-репозиторий во временном каталоге: реальный репозиторий
# форка тест не трогает.
#
# Запуск:  bats scripts/test/check-core-patches.bats
# Нужен:   git, bash (bats-core).

setup() {
  REPO="$BATS_TEST_TMPDIR/repo"
  SRC="$BATS_TEST_TMPDIR/src"
  mkdir -p "$REPO" "$SRC"

  # Скрипт и реестр берутся из настоящего репозитория (TESTED_REPO переопределяется
  # при запуске; по умолчанию — текущий каталог, откуда вызван bats).
  # Каталог scripts/ обязателен: скрипт вызывается как scripts/check-core-patches.sh
  # относительно корня фикстуры (127 = не найден при ошибке здесь).
  TESTED_REPO="${TESTED_REPO:-$PWD}"
  mkdir -p "$SRC/scripts" "$SRC/docs"
  cp "$TESTED_REPO/scripts/check-core-patches.sh" "$SRC/scripts/"
  printf '# PATCHES\n\n| ID | Файл | Что изменено | Зачем | Можно в upstream? | Риск |\n| --- | --- | --- | --- | --- | --- |\n' \
    > "$SRC/docs/PATCHES.md"

  # Upstream-файлы внутри .claude/ (8 на twenty/v2.45.6): settings.json + 7 skills
  mkdir -p "$REPO/.claude/skills/qa-scout"
  echo '{"integrity":"upstream"}' > "$REPO/.claude/settings.json"
  echo '# upstream skill'        > "$REPO/.claude/skills/qa-scout/SKILL.md"
  # Наш файл в том же .claude/ (вне upstream)
  mkdir -p "$REPO/.claude/rules"
  echo '# our rule' > "$REPO/.claude/rules/ours.md"

  cp -R "$SRC/." "$REPO/"

  git -C "$REPO" init -q
  git -C "$REPO" config user.email test@example.com
  git -C "$REPO" config user.name test
  git -C "$REPO" add -A
  git -C "$REPO" commit -qm "baseline"
  git -C "$REPO" branch -q upstream-base   # BASE по умолчанию
}

# check <режим...> — запуск гейта ИЗ фикстуры: скрипт ищет docs/PATCHES.md
# относительно текущего каталога, поэтому cd в репозиторий-фикстуру обязателен.
# Код возвращается через $status (bats).
check() {
  run bash -c "cd '$REPO' && bash scripts/check-core-patches.sh $*"
}

@test "clean tree: both modes exit 0" {
  check --staged;         [ "$status" -eq 0 ]
  check;                  [ "$status" -eq 0 ]
}

@test "A2: edit upstream .claude/settings.json without registry entry -> exit 1" {
  echo '{"tampered":true}' > "$REPO/.claude/settings.json"
  git -C "$REPO" add .claude/settings.json
  check --staged
  [ "$status" -eq 1 ]
  [[ "$output" == *".claude/settings.json"* ]]
  [[ "$output" == *"Нет в docs/PATCHES.md"* ]]
}

@test "A2: edit upstream skill .claude/skills/qa-scout/SKILL.md -> exit 1" {
  echo '# tampered' >> "$REPO/.claude/skills/qa-scout/SKILL.md"
  git -C "$REPO" add .claude/skills/qa-scout/SKILL.md
  check --staged
  [ "$status" -eq 1 ]
  [[ "$output" == *"qa-scout"* ]]
}

@test "our own file inside .claude/ (rules) needs no entry -> exit 0" {
  echo '# changed' >> "$REPO/.claude/rules/ours.md"
  git -C "$REPO" add .claude/rules/ours.md
  check --staged
  [ "$status" -eq 0 ]
  [[ "$output" == *"правок ядра нет"* ]]
}

@test "edit in our docs/ needs no entry -> exit 0" {
  echo 'x' >> "$REPO/docs/PATCHES.md"
  git -C "$REPO" add docs/PATCHES.md
  check --staged
  [ "$status" -eq 0 ]
}

@test "edit in core packages/ without entry -> exit 1" {
  mkdir -p "$REPO/packages/twenty-front/src"
  echo 'x' > "$REPO/packages/twenty-front/src/index.tsx"
  git -C "$REPO" add packages
  check --staged
  [ "$status" -eq 1 ]
}

@test "registry entry clears the error for that file" {
  echo '{"tampered":true}' > "$REPO/.claude/settings.json"
  git -C "$REPO" add .claude/settings.json
  check --staged; [ "$status" -eq 1 ]

  printf '| P-001 | .claude/settings.json | тест | тест | нет | низкий |\n' \
    >> "$REPO/docs/PATCHES.md"
  git -C "$REPO" add docs/PATCHES.md
  check --staged
  [ "$status" -eq 0 ]
}
