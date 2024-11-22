# Map of Science

Discover the landscape of human knowledge through an interactive map.

Navigate continents of scientific fields, dive into countries of subfields, and discover cities - whose size reflects the volume of research on each topic. The proximity of areas on the map mirrors how closely related the fields are.

[**👉 LIVE DEMO HERE**](https://dsonyy.github.io/map_of_science/)

## Installation

### Prerequisites

1. Required: [Node.js@^22](https://nodejs.org/en/download/)
2. Required: [npm](https://www.npmjs.com/get-npm) (Node Package Manager), which comes with Node.js.
3. Optional: [nvm](https://github.com/nvm-sh/nvm) for managing Node.js versions.

You can verify the installation by running in the command line:

```bash
node -v
npm -v
```

If you're an `nvm` user, you can install the required Node.js version by running:

```
nvm install
```

### Build and run

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the application:
   ```bash
   npm run build
   ```
4. Start the application locally:
   ```bash
   npm run start
   ```
5. Open the application in the browser at the address displayed in the logs, probably [http://localhost:8080/](http://localhost:8080/)

## Editing

### Map

The map used in this project is located in `asset/foreground.svg`. It contains all the graphical elements used in the application. However, the file is being processed by the application to display only the relevant parts.

Example map SVG with valid settings, can be found in `templates/foreground_template.svg`.

### Layers

- The SVG file contains multiple layers, each associated with objects.
- The application sorts the layers lexicographically, displaying them in order from the most general to the most specific, depending on zoom level.
- Only the lexicographical order of layers matters; their names are irrelevant.
  Hidden layers in Inkscape are ignored by the application.
- You can manage layers using Inkscape's _Layers and Objects_ tool.

### Labels

- Objects within the SVG file can have labels.
- To add a label, assign the `inkscape:label` attribute or `id` to the object.
- Labels recognized by the application must start with `#` (e.g., `#Photonics`, `#Zażółć gęślą jaźń`).
- Labeling can be managed using Inkscape's "Layers and Objects" tool.

### Articles

The application uses HTML files to dynamically load article content. They are located in the `articles` directory. Each article is a separate file, named after the **label** of the object it describes.

Labels are converted to filenames by skipping the first `#` character, replacing non-alphanumeric characters with underscores. For example:

- `#Material Science` -> `material_science.html`
- `#Zażółć Jaźń` -> `za_____ja__.html`

The article files can contain any HTML content, including images, links, and other media. They will be displayed in a modal window when the user clicks on the object with the corresponding label.

Example article file can be found in `templates/article_template.html`.

## Data points

This application draws inspiration from the data set behind (yet another) _Map of Science_ project, maintained by the [Emerging Technology Obervatory (ETO)](https://sciencemap.eto.tech/?mode=map). It includes hundreds of millions of scholarly publications from around the world, algorithmically organized into over 85,000 research clusters.

### Notes

- The original, ETO's dataset is publicly [available here](https://doi.org/10.5281/zenodo.12628195).
- The sources and methodology behind the dataset is described in detail in the [ETO's Research Cluster Dataset Documentation](https://eto.tech/dataset-docs/mac-clusters/#overview)
- The dataset is licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).

### Citation

Melot, J., Arnold, Z., Gelles, R., Quinn, K., Rahkovsky, I., & Toney-Wails, A. (2024). CSET Map of Science [Data set]. Zenodo. [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.12628195.svg)](https://doi.org/10.5281/zenodo.12628195)
