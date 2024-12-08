---
"map_of_science": minor
---

Drop the `streaming-tsv-parser.js` CSV parser:

- Add a generic `csv` parser based on [`csv-parse`](https://www.npmjs.com/package/csv-parse).
- Use the new parser in `points.js`.

_Notice_: The new implementation doesn't use Web Workers. This is temporary and will be implemented using Comlink.
