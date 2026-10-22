# Search O Pal Admin

One React JavaScript application using the shadcn-admin theme, the existing backend, Material React Table, React Query, and Formik.

## Folder structure

```text
lead-management-saas/
+-- public/                     # Public files and theme license
+-- src/
¦   +-- assets/                 # Images and styles
¦   +-- components/             # Shared UI, charts, tables, hooks, and helpers
¦   ¦   +-- ui/                 # shadcn components in JSX
¦   ¦   +-- charts/
¦   ¦   +-- tables/             # Material React Table wrappers
¦   ¦   +-- hooks/
¦   ¦   +-- lib/
¦   ¦   +-- providers/          # Material UI theme
¦   +-- layouts/                # Sidebar, header, and role menus
¦   +-- pages/                  # Screens grouped by feature
¦   ¦   +-- shared/             # API services, validation, user state, utilities
¦   +-- App.jsx                 # Routes and access rules
¦   +-- main.jsx                # React entry and application providers
+-- package.json
+-- vite.config.js
```

There are no separate theme or source-project copies. `node_modules/` is installed dependencies; `dist/` is the generated production build. Both are ignored by Git.

## Run

```sh
npm install
npm run dev
```

```sh
npm run build
npm test
```

Use the existing account and email verification flow. Optional API overrides are documented in `.env.example`. Development and production retain their original backend defaults.

## Styling and components

The shadcn components were converted to JSX from [shadcn-admin](https://github.com/satnaing/shadcn-admin), with React 18 ref support. The upstream license is retained in `public/licenses/shadcn-admin-MIT.txt`.

Theme styles live in `src/assets/styles/`. Legacy SCSS lives in `src/assets/styles/legacy/`; Vite compiles it when the configuration loads. Edit the SCSS originals, not the generated CSS. Restart the development server after editing legacy SCSS.

`components.json` configures future shadcn additions for JavaScript and the new paths. Vite resolves `@/` to `src/`.

## Migration status

The shared sidebar, header, role menus, authentication screens, buttons, inputs, statistics cards, and common filters use shadcn components. Feature-specific forms, dialogs, date pickers, and chart containers still include legacy controls awaiting migration.

React Router, React Query v3, Formik/Yup, Zustand, API services, and Material React Table remain in place. The production build and all 11 navigation tests pass. Browser visuals and live authenticated workflows have not been verified in this session. The retained feature bundle still emits size warnings, and installation reported seven dependency audit findings for separate review.
