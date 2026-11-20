# Профили VS Code фронтенд-клуба

Готовые профили VS Code для каждого стека: расширения + базовые настройки
(форматирование при сохранении, автофиксы линтеров, file nesting, Folder Templates для FSD).

| Профиль | Файл | Ответственный |
|---|---|---|
| React | `dist/M-Social React v1.code-profile` | фронтенд-клуб |
| React Native (Expo) | `dist/M-Social React Native v1.code-profile` | фронтенд-клуб |
| Vue | `dist/M-Social Vue v1.code-profile` | фронтенд-клуб |
| Svelte | `dist/M-Social Svelte v1.code-profile` | фронтенд-клуб |
| Angular | `dist/M-Social Angular v1.code-profile` | фронтенд-клуб |
| Flutter | `dist/M-Social Flutter v1.code-profile` | фронтенд-клуб |

## Установка

1. Скачайте профиль своего стека из папки [`dist/`](dist): откройте файл → кнопка **Download raw file**.
2. В VS Code: `Ctrl+Shift+P` → **Profiles: Import Profile…** → **Select File…** → выберите скачанный `.code-profile`.
3. В окне предпросмотра нажмите **Create Profile**. VS Code установит расширения в этот профиль.
4. Откройте проект **через его `.code-workspace`** (**File → Open Workspace from File…**) и уже в этом окне
   выберите профиль: шестерёнка внизу слева → **Profiles** → нужный профиль.
   VS Code запомнит выбор для этого воркспейса. Папка и `.code-workspace` для VS Code — разные объекты:
   профиль, привязанный к папке, не включится при открытии воркспейса, и наоборот.
5. Перенесите свои личные настройки (тема, шрифт, хоткеи) в новый профиль:
   `Ctrl+Shift+P` → **Preferences: Open User Settings (JSON)**.

## Что в профиле, а что в проекте

Профиль — это **личный слой**. Он не заменяет настройки репозитория.

- **В профиле:** расширения стека, `formatOnSave`, автофиксы, file nesting, Folder Templates, удобства (`compactFolders`, `linkedEditing`).
- **В проекте** (`.code-workspace` / `.vscode/`): выбор форматтера (Prettier или oxc), версия TypeScript (`js/ts.tsdk.path`), `cssModules.camelCase`, исключения из поиска, `extensions.json`.

Настройки проекта перекрывают профиль. Проект должен корректно работать и у того, кто профиль не импортировал.

## Обновление профиля

1. Измените исходники в `src/`.
2. Поднимите версию в `src/<стек>/profile.json` (`v1` → `v2`).
3. Соберите: `node build.mjs` (нужен Node.js 18+, зависимостей нет).
4. Закоммитьте и `src/`, и `dist/`.

Пользователи импортируют новую версию как **новый** профиль и удаляют старый,
чтобы не затереть свои правки.

## Структура

```
src/
  shared/                 — для ВСЕХ стеков (включая Flutter)
    base.settings.jsonc   — formatOnSave, linkedEditing, compactFolders
    file-nesting.jsonc    — снимок конфига antfu (обновляется расширением antfu.file-nesting)
    extensions.json       — EditorConfig, Code Spell Checker, File Nesting
  layers/
    web/                  — слой для JS/TS-стеков: ESLint, Prettier, Oxc, Pretty TS Errors, автофиксы, js/ts-настройки
  react/ react-native/ vue/ svelte/ angular/ flutter/
    profile.json          — имя, иконка, подключаемые слои ("layers": ["web"]), расширения стека
    settings.jsonc        — настройки стека (сливаются со shared и слоями), Folder Templates
build.mjs                 — сборка dist/*.code-profile
```

Порядок слияния: `shared` → слои из `layers` → стек. Объекты сливаются по ключам
(например, `editor.codeActionsOnSave` дополняется), массивы и значения заменяются.

Новый стек = новая папка в `src/` с `profile.json` (+ `settings.jsonc` при необходимости).

## Правила

- В профиль попадают только **Settings** и **Extensions**. Хоткеи, сниппеты, темы — личное.
- Расширение попадает в профиль, только если оно нужно большинству проектов стека.
  Узкоспециализированное (Vitest, Playwright, Tailwind…) — в `extensions.json` конкретного проекта.
- Не ставим плагины, которые дублируют встроенные функции VS Code
  (Auto Rename Tag, Bracket Pair Colorizer, Path Intellisense) или инструменты проекта (Prettier ESLint).
