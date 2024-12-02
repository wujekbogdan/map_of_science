import styled from "styled-components";
import { zoomToScale } from "../../js/chart";
import { useStore } from "../../store.ts";

export const ZoomControls = () => {
  const { zoomStepFactor, zoom: currentZoom } = useStore();

  return (
    <ZoomControlsStyled>
      <Button
        onClick={() => {
          const desiredZoom = currentZoom * zoomStepFactor;
          zoomToScale(desiredZoom);
        }}
      >
        +
      </Button>
      <Button
        onClick={() => {
          const desiredZoom = currentZoom / zoomStepFactor;
          zoomToScale(desiredZoom);
        }}
      >
        &minus;
      </Button>
    </ZoomControlsStyled>
  );
};

const ZoomControlsStyled = styled.div`
  box-sizing: border-box;
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
  border-bottom: 1px solid #eee;
  font-size: 24px;
  transition: background-color 0.1s ease-in-out;
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
