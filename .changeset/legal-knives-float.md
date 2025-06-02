---
"@map-of-science/eslint": minor
---

Drop the `bin` entry from the `package.json`. It's no longer needed since the `autoInstallPeers: false` pnpm setting forces ESLint to be explicitly installed by packages that rely on `@map-of-science/eslint`.
