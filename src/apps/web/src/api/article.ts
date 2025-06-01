const articles: Record<string, () => Promise<{ default: string }>> =
  Object.entries(import.meta.glob("../articles/*.md")).reduce(
    (acc, [path, importFn]) => {
      return {
        ...acc,
        [path.replace("../articles/", "").replace(".md", "")]: importFn,
      };
    },
    {},
  );

const labelTextToLabelId = (label: string) => {
  return label.toLowerCase().replace(/[^a-z0-9]/g, "_"); // Replace non-alphanumeric characters with underscores
};

export const isArticleAvailable = (articleName: string) => {
  const labelId = labelTextToLabelId(articleName);
  return labelId in articles;
};

const markdownToHtml = async (markdown: string) => {
  const { marked } = await import("marked");

  return marked.parse(markdown);
};

export const fetchArticle = async (label: string) => {
  const labelId = labelTextToLabelId(label);

  const path = (await articles[labelId]()).default;
  if (!path) {
    throw new Error(`Article not found: ${labelId}`);
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch article: labelId:${labelId}, response: ${response.statusText}`,
    );
  }

  return await markdownToHtml(await response.text());
};
