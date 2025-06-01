import { ReactNode } from "react";
import styled from "styled-components";
import pin from "../icons/pin.svg";
import search from "../icons/search.svg";
import zone from "../icons/zone.svg";

export type Token = { text: string; type: "regular" | "bold" };

type Props = {
  tokens?: Token[];
  type: "query" | "label" | "point";
  children?: ReactNode;
};

const Label = ({ tokens, type, children }: Props) => {
  const types = {
    query: search,
    label: zone,
    point: pin,
  };

  return (
    <LabelRoot>
      <Icon src={types[type]} role="presentation" alt={type} />
      {tokens?.map((token, index) => (
        <Token key={index} $type={token.type}>
          {token.text}
        </Token>
      ))}
      <span>{children}</span>
    </LabelRoot>
  );
};

const LabelRoot = styled.div`
  display: flex;
  align-items: center;
`;

const Icon = styled.img`
  margin-right: 16px;
`;

const Token = styled.span<{
  $type: "regular" | "bold";
}>`
  color: #1f1f1f;
  font-weight: ${({ $type }) => ($type === "bold" ? "bold" : "normal")};
`;

export default Label;
