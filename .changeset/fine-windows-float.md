---
"@map-of-science/typescript": minor
---

Rename the `node `config to `vite` since this was never a true Node.js config. It was only a Node.js config in the sense
that it was used for Vite, which runs in a Node environment. It wasn't used for any "true" Node.js app.
