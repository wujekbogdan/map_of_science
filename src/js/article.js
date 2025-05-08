// TODO: There's no legacy code that still uses article.js. Let's move all the code to TS.
const articles = Object.entries(import.meta.glob("../articles/*.md")).reduce(
  (acc, [path, importFn]) => {
    return {
      ...acc,
      [path.replace("../articles/", "").replace(".md", "")]: importFn,
    };
  },
  {},
);

function labelTextToLabelId(labelText) {
  return labelText
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9]/g, "_"); // Replace non-alphanumeric characters with underscores
}

const markdownToHtml = async (markdown) => {
  const { marked } = await import("marked");

  return marked.parse(markdown);
};

export async function fetchArticle(labelText) {
  const labelId = labelTextToLabelId(labelText);

  try {
    const path = (await articles[labelId]())?.default;
    if (!path) {
      console.error("Article not found:", {
        id: labelId,
      });
      return null;
    }

    const response = await fetch(path);
    if (!response.ok) {
      console.error("Error fetching article content", {
        id: labelId,
      });
      return null;
    }

    return markdownToHtml(await response.text());
  } catch (error) {
    console.error("Error fetching article content:", error?.message);
    return null;
  }
}
