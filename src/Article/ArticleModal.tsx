import { ReactElement, useRef } from "react";
import styled from "styled-components";
import { i18n } from "../i18n.ts";
import { useClickAway } from "react-use";

type Props = {
  children: ReactElement;
  onClose?: () => void;
};

export const ArticleModal = ({ children, onClose }: Props) => {
  const ref = useRef(null);

  useClickAway(ref, () => {
    console.log("click away");
    onClose?.();
  });

  return (
    <Overlay>
      <ArticleWrapper ref={ref}>
        <Header>
          <CloseButton
            onClick={() => {
              onClose?.();
            }}
          >
            {i18n("Zamknij")} ✕
          </CloseButton>
        </Header>
        <Content>{children}</Content>
      </ArticleWrapper>
    </Overlay>
  );
};

// This feels like a hack, and indeed it is a hack. useClickAway doesn't seem to
// recognize when the click event's target is an SVG element. One way to fix
// this would be to set pointer-events to none on the SVG element, but this
// would create unnecessary complexity and coupling, so I went with a
// transparent overlay instead that will catch the click.
const Overlay = styled.div`
  z-index: 30;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const ArticleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 40px;
  right: 40px;
  bottom: 40px;
  width: 40%;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
`;

const Header = styled.header`
  display: flex;
`;

const Content = styled.section`
  flex-grow: 1;
`;

const Button = styled.button`
  border-radius: 4px;
  border: 1px solid #ddd;
  padding: 8px 12px;
  cursor: pointer;

  &:hover {
    border-color: #ccc;
  }

  &:focus {
    border-color: #999;
    outline: none;
  }
`;

const CloseButton = styled(Button)``;
