#!/usr/bin/env bash
# Retained locally for an explanatory error; excluded from the source delivery.
set -euo pipefail
printf '%s\n' 'Автоматическая загрузка отключена. Старый скрипт включал внутренние документы.' 'Проверенный перечень исходников: scripts/source-files.mjs.' 'Git add, commit и push выполняются только после отдельного решения владельца.' >&2
exit 1
