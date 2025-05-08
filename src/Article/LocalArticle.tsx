type Props = {
  html: string;
};

export const LocalArticle = ({ html }: Props) => {
  // It says dangerouslySetInnerHTML, but it's safe because the content comes
  // from local markdown files we control.
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};
