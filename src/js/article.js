const articles = Object.entries(import.meta.glob("../articles/*.html")).reduce(
  (acc, [path, importFn]) => {
    return {
      ...acc,
      [path.replace("../articles/", "").replace(".html", "")]: importFn,
    };
  },
  {},
);

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

async function fetchArticle(labelText) {
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

    return await response.text();
  } catch (error) {
    console.error("Error fetching article content:", error?.message);
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
  const labelId = labelTextToLabelId(articleName);
  return labelId in articles;
}
