#!/usr/bin/env bash
# Creates (if missing) a PRIVATE repository and uploads this project.
# Requires the owner's local GitHub CLI session. Does not enable Pages.
set -euo pipefail
export GH_HOST=github.com
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="${1:-BabyninAleks-Zi/ais-landing}"
if [[ "$REPO" == "--help" || "$REPO" == "-h" ]]; then
  printf '%s\n' 'Usage: bash scripts/push-private.sh OWNER/ais-landing' 'Creates or checks a private repo. Empty repo: main. Nonempty repo: delivery branch + PR. Never enables Pages.'
  exit 0
fi
if [[ ! "$REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then echo 'Некорректный OWNER/REPO.' >&2; exit 1; fi
for command in gh git node npm tar; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Требуется $command. Сначала установите инструмент; инструкция в README.md." >&2; exit 1
  fi
done
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo 'Сначала выполните: gh auth login --hostname github.com --web --scopes workflow' >&2; exit 1
fi
LOGIN="$(gh api user --jq .login)"
OWNER="${REPO%%/*}"
if [[ "$LOGIN" != "$OWNER" ]]; then
  echo "Вы авторизованы как $LOGIN, но целевой владелец — $OWNER. Переключите аккаунт; скрипт остановлен." >&2; exit 1
fi
if [[ "$(node -p "require('$ROOT/package.json').name")" != 'ais-landing' ]]; then echo 'Неверная папка проекта.' >&2; exit 1; fi
printf '\nБудет загружен полный исходный проект и PDF в ПРИВАТНЫЙ репозиторий %s.\n' "$REPO"
printf 'Pages не включается. Публичная версия не выпускается.\nДля подтверждения введите private: '
read -r CONFIRM
if [[ "$CONFIRM" != 'private' ]]; then echo 'Отменено. Репозиторий не изменён.'; exit 1; fi
cd "$ROOT"
npm run verify
if gh repo view "$REPO" --json isPrivate >/dev/null 2>&1; then
  PRIVATE="$(gh repo view "$REPO" --json isPrivate --jq .isPrivate)"
  if [[ "$PRIVATE" != true ]]; then echo 'Остановлено: репозиторий не приватный. Ничего не загружено.' >&2; exit 1; fi
else
  echo 'Репозиторий не найден или недоступен. Пробуем создать новый приватный; существующий не изменяем.'
  gh repo create "$REPO" --private --description 'AIS — презентация инженерного проекта. Private source and investor materials.'
fi
[[ "$(gh repo view "$REPO" --json isPrivate --jq .isPrivate)" == true ]] || { echo 'Не подтверждена приватность.' >&2; exit 1; }
TEMP="$(mktemp -d "${TMPDIR:-/tmp}/ais-upload.XXXXXXXX")"
trap 'rm -rf "$TEMP"' EXIT
gh repo clone "$REPO" "$TEMP/repo"
cd "$TEMP/repo"
BASE=''
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  BASE="$(git branch --show-current)"
  [[ -n "$BASE" ]] || { echo 'Не определена базовая ветка.' >&2; exit 1; }
  # Do not import the website into an unrelated existing application repository.
  EXISTING="$(git ls-tree -r --name-only HEAD | grep -v -E '^(README(\.md|\.txt)?|\.gitignore|LICENSE(\.md|\.txt)?)$' || true)"
  if [[ -n "$EXISTING" ]]; then echo 'Репозиторий уже содержит проект. Автоматическая загрузка остановлена; используйте новый репозиторий.' >&2; exit 1; fi
  BRANCH="delivery/ais-landing-$(date +%Y%m%d-%H%M%S)"
  git switch -c "$BRANCH"
else
  BRANCH=main
  git switch --orphan main
fi
if ! git var GIT_AUTHOR_IDENT >/dev/null 2>&1; then
  echo 'Настройте Git user.name / user.email на своём компьютере. Скрипт не придумывает автора коммита.' >&2; exit 1
fi
# Explicit allowlist: no local credentials, output folders or unrelated files.
(cd "$ROOT" && tar -cf - .github .gitignore .gitattributes .nvmrc package.json package-lock.json README.md SECURITY.md CHANGELOG.md START_HERE_RU.md src content assets private-assets scripts tests docs reference) | tar -xf -
git add -- .github .gitignore .gitattributes .nvmrc package.json package-lock.json README.md SECURITY.md CHANGELOG.md START_HERE_RU.md src content assets private-assets scripts tests docs reference
git commit -m 'Deliver standalone AIS landing with verified source data and guarded deployment'
# Check privacy again immediately before transmitting investor files.
[[ "$(gh repo view "$REPO" --json isPrivate --jq .isPrivate)" == true ]] || { echo 'Приватность изменилась: отправка отменена.' >&2; exit 1; }
git push -u origin "$BRANCH"
if [[ -n "$BASE" ]]; then
  gh pr create --repo "$REPO" --base "$BASE" --head "$BRANCH" --title 'AIS: автономный лендинг и безопасная подготовка публикации' --body 'Сохранены данные пакета 12.09.2026, исправлены логотип, адаптивность, навигация и финансовая графика. Полный проект предназначен для приватного репозитория. Pages не включён. Публичная сборка не содержит инвестиционных данных.'
fi
printf '\nГотово: https://github.com/%s/tree/%s\n' "$REPO" "$BRANCH"
printf 'Репозиторий приватный. Сайт НЕ опубликован.\n'
