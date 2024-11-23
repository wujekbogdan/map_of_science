import { PATH_TO_ARTICLES } from "./config";

let cachedArticleList = null;

function disableArticleInAnimation(article) {
  article.classList.remove("animate__animated");
  article.classList.remove("animate__fadeInRight");
  article.classList.remove("animate__faster");
}

function enableArticleInAnimation(article) {
  article.classList.add("animate__animated");
  article.classList.add("animate__fadeInRight");
  article.classList.add("animate__faster");
}

function disableArticleOutAnimation(article) {
  article.classList.remove("animate__animated");
  article.classList.remove("animate__fadeOutRight");
  article.classList.remove("animate__faster");
}

function enableArticleOutAnimation(article) {
  article.classList.add("animate__animated");
  article.classList.add("animate__fadeOutRight");
  article.classList.add("animate__faster");
}

export function disableArticle() {
  const article = document.getElementById("article");
  // article.style.visibility = "hidden";
  disableArticleInAnimation(article);
  enableArticleOutAnimation(article);
}

export function enableArticle(dataPoint) {
  const article = document.getElementById("article");
  buildArticle(dataPoint);
  article.style.visibility = "visible";
  disableArticleOutAnimation(article);
  enableArticleInAnimation(article);
}

export function enableLabelArticle(labelText) {
  const article = document.getElementById("article");
  buildLabelArticle(labelText);
  article.style.visibility = "visible";
  disableArticleOutAnimation(article);
  enableArticleInAnimation(article);
}

function buildArticle(dataPoint) {
  const article = document.getElementById("article-content");
  const url =
    "https://sciencemap.eto.tech/cluster/?version=2&cluster_id=" +
    dataPoint.clusterId;

  article.innerHTML = buildArticleContent(dataPoint, url);

  const articleClose = document.getElementById("article-close");
  articleClose.onclick = () => {
    disableArticle();
  };

  const articleOpen = document.getElementById("article-open");
  articleOpen.onclick = () => {
    window.open(url, "_blank");
  };
}

function buildArticleContent(dataPoint, url) {
  const html =
    "<section>" +
    "<button id='article-close'>✖ Zamknij</button>" +
    "<button id='article-open'>⬈ Otwórz w nowym oknie</button>" +
    "</section>" +
    "<section><p>Więcej informacji na temat klastra <strong>#" +
    dataPoint.clusterId +
    "</strong> ze strony projektu ETO Map of Science:</p></strong></section>" +
    "<iframe src='" +
    url +
    "' width='100%' height='100%'></iframe>";

  return html;
}

function labelTextToLabelId(labelText) {
  return labelText
    .toLowerCase() // Convert to lowercase
    .replace(/[^a-z0-9]/g, "_"); // Replace non-alphanumeric characters with underscores
}

function labelTextToArticleUri(labelText) {
  const labelId = labelTextToLabelId(labelText);
  return PATH_TO_ARTICLES + `${labelId}.html`; // Assuming the HTML files are in the 'articles' directory
}

async function fetchArticle(labelText) {
  const articleUri = labelTextToArticleUri(labelText);
  try {
    const response = await fetch(articleUri);
    if (response.ok) {
      const content = await response.text();
      return content;
    }
    return null;
  } catch (error) {
    console.error("Error fetching article content:", error);
    return null;
  }
}

function buildLabelArticle(labelText) {
  const article = document.getElementById("article-content");

  article.innerHTML =
    "<section>" +
    "<button id='article-close'>✖ Zamknij</button>" +
    "</section>";

  fetchArticle(labelText).then((content) => {
    article.innerHTML += "<section>" + content + "</section>";

    const articleClose = document.getElementById("article-close");
    articleClose.onclick = () => {
      disableArticle();
    };
  });
}

export function isArticleAvailable(articleName) {
  const articleFilename = labelTextToLabelId(articleName) + ".html";
  const is = getAvailableArticleList().includes(articleFilename);
  return is;
}

export async function fetchAvailableArticlesList() {
  // TODO: Restore
  // Temporarily disabled due to removal of the Webpack ArticleListGeneratorPlugin
  // Likely the plugin won't be needed anymore after React migration
  // if (cachedArticleList) {
  //   return Promise.resolve(cachedArticleList);
  // }
  //
  // try {
  //   const response = await fetch("articlesList.json");
  //   const articleList = await response.json();
  //   cachedArticleList = articleList;
  //   return articleList;
  // } catch (error) {
  //   console.error("Error fetching article list:", error);
  //   return [];
  // }
}

export function getAvailableArticleList() {
  return cachedArticleList;
}
