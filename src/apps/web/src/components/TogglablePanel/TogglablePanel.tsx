import {
  useFloating,
  useHover,
  useInteractions,
  useDismiss,
  offset,
  flip,
  shift,
} from "@floating-ui/react";
import { ReactNode, useState } from "react";
import styled from "styled-components";
import { i18n } from "../../i18n.ts";

type State = "collapsed" | "expanded";

type Props = {
  initialState: State;
  header: ReactNode;
  children: ReactNode;
  onToggle?: (state: State) => void;
  isDropdown?: boolean;
  mode?: "hover" | "click";
};

export const TogglablePanel = (props: Props) => {
  const { header, children, mode: rawMode, onToggle } = props;
  const mode = rawMode ?? "click";
  const [visibility, setVisibility] = useState<State>(props.initialState);
  const isExpanded = visibility === "expanded";
  const oppositeState = isExpanded ? "collapsed" : "expanded";
  const isHoverMode = mode === "hover";

  const { refs, floatingStyles, context } = useFloating({
    open: isExpanded,
    middleware: [offset(0), flip(), shift({ padding: 0 })],
    onOpenChange: (open) => {
      const newState = open ? "expanded" : "collapsed";
      setVisibility(newState);
      onToggle?.(newState);
    },
  });

  const hover = useHover(context, {
    enabled: mode === "hover",
    delay: {
      open: 50,
      close: 0,
    },
  });
  const dismiss = useDismiss(context, {
    enabled: props.isDropdown,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
  ]);

  const containerRef = isHoverMode ? refs.setReference : undefined;
  const containerProps = isHoverMode ? { ...getReferenceProps() } : {};

  const onClick = () => {
    if (mode !== "click") return;

    setVisibility(oppositeState);
    onToggle?.(oppositeState);
  };

  const PanelComponent = props.isDropdown ? PanelPositionedAbsolutely : Panel;

  return (
    <Container ref={containerRef} {...containerProps}>
      <TitleBar $hovered={mode === "hover" && isExpanded}>
        <Title>{header}</Title>
        {mode === "click" && (
          <Toggle onClick={onClick} role="button">
            <SrOnly>{isExpanded ? i18n("Minimize") : i18n("Maximize")}</SrOnly>
            <Icon $expanded={isExpanded}>{isExpanded ? "▼" : "▲"}</Icon>
          </Toggle>
        )}
      </TitleBar>
      {isExpanded && (
        <PanelComponent
          ref={refs.setFloating}
          style={props.isDropdown ? floatingStyles : undefined}
          {...getFloatingProps()}
        >
          {children}
        </PanelComponent>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
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

const TitleBar = styled.div<{ $hovered?: boolean }>`
  background: ${({ $hovered }) => ($hovered ? "#ededed" : "#f5f4f4")};
  display: flex;
  justify-content: space-between;
  transition: background 0.2s ease;
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

const Panel = styled.div`
  background: #fff;
  overflow: hidden;
`;

const PanelPositionedAbsolutely = styled(Panel)`
  position: absolute;
  top: 100%;
`;

export default TogglablePanel;
