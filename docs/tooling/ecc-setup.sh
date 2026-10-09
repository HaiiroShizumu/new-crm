#!/usr/bin/env bash
# setup.sh — воспроизводимая установка ECC в этот стек (Hermes + Cursor + Claude Code).
# Запускать из корня папки agent-harnesses. Идемпотентность: повторный запуск
# перезаписывает managed-файлы (см. ecc doctor / ecc repair).
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ECC="$HERE/ECC"

if [ ! -d "$ECC" ]; then
  echo "[1/5] Клонирую ECC…"
  git clone --depth 1 https://github.com/affaan-m/ECC.git "$ECC"
else
  echo "[1/5] ECC уже склонирован: $ECC"
fi

echo "[2/5] Cursor: профиль developer + hooks -> $HERE/.cursor"
(cd "$HERE" && "$ECC/install.sh" --profile developer --target cursor --enable-hooks)

echo "[3/5] Claude Code: профиль minimal -> $HERE/.claude"
(cd "$HERE" && "$ECC/install.sh" --profile minimal --target claude-project)

echo "[4/5] Hermes: профиль minimal -> ~/.hermes"
(cd "$HERE" && "$ECC/install.sh" --profile minimal --target hermes)

# Фикс известного gap адаптера хуков Cursor (#2419): adapter.js ищет scripts/hooks
# в КОРНЕ проекта, а установщик кладёт их в .cursor/scripts/hooks.
# Симклинг — managed-файлом не является, repair/auto-update его не трогают.
echo "[5/5] Симклинг scripts -> .cursor/scripts (иначе хуки Cursor молча не работают)"
[ -e "$HERE/scripts" ] || ln -s .cursor/scripts "$HERE/scripts"

echo
echo "Проверка:"
(cd "$HERE" && node "$ECC/scripts/ecc.js" doctor)
