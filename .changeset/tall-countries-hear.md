---
"map_of_science": minor
---

Multiple performance improvements:

- Replace several `.filter()` loops with regular `for` loops to allow breaking the loop early when the threshold is hit.
- Replace `DataPoint` `styled-components` with (S)CSS modules.
- Replace multiple `DataPoint` instances with a single `DataPoints` component rendering all data points in a single loop.
- Replace `DataPoint` dynamically generated SVG attributes with a CSS-based solution using CSS `calc()`.
- Simplify `DataPoint` shape generation by using a single shape for all data points, regardless of the article count.
