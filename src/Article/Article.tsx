import { LocalArticle } from "./LocalArticle.tsx";
import { ArticleModal } from "./ArticleModal.tsx";
import { useArticleStore } from "../store.ts";
import { IframeArticle } from "./IframeArticle.tsx";

export const Article = () => {
  const { type, id, article, reset } = useArticleStore();

  if (!type) {
    return null;
  }

  const Component =
    type === "iframe" ? (
      <IframeArticle id={id} />
    ) : (
      <LocalArticle html={article} />
    );

  return (
    <ArticleModal
      children={Component}
      onClose={() => {
        reset();
      }}
    />
  );
};
