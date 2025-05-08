import { i18n } from "../i18n.ts";
import styled from "styled-components";

export const IframeArticle = ({ id }: { id: number }) => {
  const url = `https://sciencemap.eto.tech/cluster/?version=2&cluster_id=${id.toString()}`;
  return (
    <Wrapper>
      <p>
        {i18n("Więcej informacji na temat klastra ")}
        <strong>#{id}</strong> {i18n("ze strony projektu ETO Map of Science")}:
      </p>
      <Iframe src={url} />
      <p>
        <a href={url} target="_blank" rel="noopener noreferrer">
          {i18n("Otórz w nowej karcie »")}
        </a>
      </p>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Iframe = styled.iframe`
  width: 100%;
  flex-grow: 1;
  border: none;
`;
