---
"map_of_science": patch
---

Fix a bug causing `VITE_BASE_URL` to be resolved as `undefined` in `vite.config.ts` if the variable was set via an `.env*` file.  
The Vite config now instantiates `dotenv` and parses `.env*` files.
