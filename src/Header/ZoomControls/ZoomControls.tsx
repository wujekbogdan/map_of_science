import styled from "styled-components";
import { useStore } from "../../store.ts";
import { useShallow } from "zustand/react/shallow";

export const ZoomControls = () => {
  const [setDesiredZoom, currentZoom, zoomStepFactor] = useStore(
    useShallow((s) => [s.setDesiredZoom, s.currentZoom, s.zoomStepFactor]),
  );
  const scale = currentZoom ? currentZoom.scale : 1;

  const zoomToScale = (scale: number) => {
    setDesiredZoom({
      x: currentZoom?.x ?? 0,
      y: currentZoom?.y ?? 0,
      scale,
    });
  };

  return (
    <ZoomControlsStyled>
      <Button
        onClick={() => {
          zoomToScale(scale * zoomStepFactor);
        }}
      >
        +
      </Button>
      <Button
        onClick={() => {
          zoomToScale(scale / zoomStepFactor);
        }}
      >
        &minus;
      </Button>
    </ZoomControlsStyled>
  );
};

const ZoomControlsStyled = styled.div`
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Button = styled.button`
  width: 48px;
  height: 48px;
  padding: 4px;
  margin: 0;
  border-radius: 0;
  border-width: 0 0 1px 0;
  border-bottom: solid #eee;
  font-size: 24px;
  transition: background-color 0.1s ease-in-out;
  cursor: pointer;

  &:hover {
    background-color: #f0f0f0;
  }
  &:last-child {
    border-bottom: 0;
  }
  &:focus {
    outline: none;
  }
`;
