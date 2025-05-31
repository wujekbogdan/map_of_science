import { ReactElement, useState } from "react";
import styled from "styled-components";
import { i18n } from "../../i18n.ts";

type State = "collapsed" | "expanded";

type Props = {
  initialState: State;
  header: string;
  children: ReactElement;
  onToggle?: (state: State) => void;
};

export const TogglablePanel = (props: Props) => {
  const { header, children, onToggle } = props;
  const [visibility, setVisibility] = useState<State>(props.initialState);
  const isExpanded = visibility === "expanded";

  const onChange = () => {
    const state = visibility === "expanded" ? "collapsed" : "expanded";
    setVisibility(state);
    onToggle?.(state);
  };

  return (
    <Container>
      <TitleBar>
        <Title>{header}</Title>
        <Toggle onClick={onChange} role="button">
          <SrOnly>{isExpanded ? i18n("Minimize") : i18n("Minimize")}</SrOnly>
          <Icon $expanded={isExpanded}>{isExpanded ? "▼" : "▲"}</Icon>
        </Toggle>
      </TitleBar>
      {isExpanded && <Panels>{children}</Panels>}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  background: #fff;
`;

const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const TitleBar = styled.div`
  background-color: #f0f0f0;
  display: flex;
  justify-content: space-between;
`;

const Toggle = styled.div`
  width: 45px;
  height: 45px;
  display: flex;
  padding: 12px;
  background-color: #e4e4e4;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: #d8d8d8;
  }
`;

const Icon = styled.div<{ $expanded: boolean }>`
  color: #999;
  font-size: 12px;
`;

const Title = styled.h2`
  margin: 12px;
  font-size: 18px;
`;

const Panels = styled.div`
  margin: 12px 12px 0;
  padding: 0 0 12px;
  overflow: hidden;
`;

export default TogglablePanel;
