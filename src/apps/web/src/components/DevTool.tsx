import styled from "styled-components";
import { useShallow } from "zustand/react/shallow";
import { i18n } from "../i18n.ts";
import { useStore } from "../store.ts";
import TogglablePanel from "./TogglablePanel/TogglablePanel.tsx";

export const DevTool = () => {
  const [
    zoom,
    fontSize,
    scaleFactor,
    setFontSize,
    setScaleFactor,
    zoomStepFactor,
    setZoomStepFactor,
    maxDataPointsInViewport,
    setMaxDataPointsInViewport,
  ] = useStore(
    useShallow((state) => [
      state.currentZoom?.scale.toFixed(2) ?? 1,
      state.fontSize,
      state.scaleFactor,
      state.setFontSize,
      state.setScaleFactor,
      state.zoomStepFactor,
      state.setZoomStepFactor,
      state.maxDataPointsInViewport,
      state.setMaxDataPointsInViewport,
    ]),
  );
  const layers = ["layer1", "layer2", "layer3", "layer4"] as const;
  const scaleFactors = ["min", "max", "zoom"] as const;

  return (
    <Form>
      <TogglablePanel header={i18n("Dev tools")} initialState="collapsed">
        <Panels>
          <Panel>
            <Header>{i18n("Data")}</Header>
            <P>
              <FormControl>
                <Label>{i18n("Visible data points limit")}</Label>
                <Input
                  type="number"
                  value={maxDataPointsInViewport}
                  onChange={(e) => {
                    setMaxDataPointsInViewport(Number(e.target.value));
                  }}
                />
              </FormControl>
            </P>
            <P>
              <Label>{i18n("Current Zoom")}</Label>
              <span>{zoom}</span>
            </P>
          </Panel>

          <Panel>
            <Header>{i18n("Font Sizes")}</Header>
            {layers.map((layer, index) => (
              <P key={layer}>
                <FormControl>
                  <Label>
                    {i18n("Layer")} {index + 1}
                  </Label>
                  <Input
                    type="number"
                    value={fontSize[layer]}
                    onChange={(e) => {
                      setFontSize(layer, e.target.value);
                    }}
                  />
                </FormControl>
              </P>
            ))}
          </Panel>

          <Panel>
            <Header>{i18n("Scale Factor")}</Header>
            {scaleFactors.map((factor) => (
              <P key={factor}>
                <FormControl>
                  <Label>{factor}</Label>
                  <Input
                    type="number"
                    value={scaleFactor[factor]}
                    onChange={(e) => {
                      setScaleFactor(factor, e.target.value);
                    }}
                  />
                </FormControl>
              </P>
            ))}
          </Panel>

          <Panel>
            <Header>{i18n("Zoom")}</Header>
            <P>
              <FormControl>
                <Label>{i18n("Zoom scale factor")}</Label>
                <Input
                  type="number"
                  value={zoomStepFactor}
                  onChange={(e) => {
                    setZoomStepFactor(Number(e.target.value));
                  }}
                />
              </FormControl>
            </P>
            <P>
              <Label>{i18n("Current Zoom")}</Label>
              <span>{zoom}</span>
            </P>
          </Panel>
        </Panels>
      </TogglablePanel>
    </Form>
  );
};

const Form = styled.form`
  color: #666;
  padding: 0;
  width: 300px;
  background: rgba(255, 255, 255, 0.7);
`;

const Panels = styled.div`
  margin: 12px 12px 0;
  overflow: hidden;
`;

const Header = styled.h3`
  margin: 4px 0 8px;
  font-size: 16px;
`;

const Panel = styled.div`
  margin: 16px 0;
  &:first-child {
    margin-top: 0;
  }
`;

const P = styled.p`
  margin: 4px 0 8px;
`;

const FormControl = styled.label`
  display: flex;
  flex-direction: column;
`;

const Label = styled.div`
  margin-bottom: 4px;
`;

const Input = styled.input`
  margin: 0 0 8px;
  padding: 4px;
  display: block;
`;
