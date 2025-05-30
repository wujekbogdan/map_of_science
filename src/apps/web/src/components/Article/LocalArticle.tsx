import styled from "styled-components";

type Props = {
  html: string;
};

export const LocalArticle = ({ html }: Props) => {
  // It says dangerouslySetInnerHTML, but it's safe because the content comes
  // from local markdown files we control.
  return <Article dangerouslySetInnerHTML={{ __html: html }} />;
};

// TODO: Implement proper styling for Markdown content.
// https://github.com/wujekbogdan/map-of-science/issues/58
const Article = styled.div`
  line-height: 1.42;
`;
