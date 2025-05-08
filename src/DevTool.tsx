import { useStore } from "./store";
import { i18n } from "./i18n";
import styled from "styled-components";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";

export const DevTool = () => {
  const [visibility, setVisibility] = useState<"collapsed" | "expanded">(
    "collapsed",
  );
  const isExpanded = visibility === "expanded";
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

  const onMinimizeClick = () => {
    setVisibility(visibility === "expanded" ? "collapsed" : "expanded");
  };

  return (
    <Form>
      <TitleBar>
        <Title>{i18n("Dev tools")}</Title>
        <Toggle onClick={onMinimizeClick} role="button">
          <SrOnly>{isExpanded ? i18n("Minimize") : i18n("Minimize")}</SrOnly>
          <Icon $expanded={isExpanded}>{isExpanded ? "▼" : "▲"}</Icon>
        </Toggle>
      </TitleBar>
      {isExpanded && (
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
      )}
    </Form>
  );
};

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

const Form = styled.form`
  color: #666;
  padding: 0;
  width: 300px;
  background: rgba(255, 255, 255, 0.7);
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

const Header = styled.h3`
  margin: 4px 0 8px;
  font-size: 16px;
`;

const Panels = styled.div`
  margin: 12px 12px 0;
  overflow: hidden;
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
