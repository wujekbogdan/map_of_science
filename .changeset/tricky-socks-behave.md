---
"@map-of-science/typescript": minor
---

Turn `typescript` into a peer dependency and drop the `typescript-plugin-css-modules` plugin, since it has to be installed by the package that uses this shared config; otherwise, it will not work.
