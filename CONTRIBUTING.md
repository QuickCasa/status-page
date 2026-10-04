# Contributing

Thanks for wanting to help. Bug reports about checks that come out wrong, and
pages that don't read clearly on a phone, are the most useful contributions.

## Rules for changes

- **No runtime dependencies.** The monitor runs with nothing but Node.js, and
  the page with nothing but the browser. That keeps scheduled runs quick and
  the page small.
- **Nothing extra leaves the browser.** The page loads its own files and the
  status documents it's configured to read. No analytics, fonts or other
  third-party requests.
- **Accurate over green.** The page never shows an old or missing check as
  operational. When in doubt, it says what it doesn't know.
- **The document format keeps working.** Other monitors write status
  documents too, so new fields have to be optional, and readers have to
  ignore fields they don't know.
- **Target URLs stay off the page.** Nothing from a target's `url` goes into
  `status.json` or the built page.
- **Config changes come with the schema.** A new setting goes in
  `shared/read-config.ts`, `status.config.schema.json` and the README's table.

## Getting set up

You need Node.js 22.18 or later.

```bash
npm install
npm run dev
npm run check
```

`npm run check` runs everything CI runs: the formatting check, the
typecheck, the tests, ESLint and the build. Code follows
[@quickcasa/eslint-config](https://github.com/QuickCasa/eslint-config), and
Prettier formats everything. Run `npm run format` before committing.

The monitor is plain TypeScript that Node runs directly, so imports use the
`.ts` extension and only syntax Node can strip, with no enums or namespaces.
`erasableSyntaxOnly` in `tsconfig.json` catches anything else.

## Deploying

Every push to `main` that passes its checks publishes the page, and the
schedule republishes it every five minutes after that. There's no package to
release.
