import { useStore } from "./store";
import { i18n } from "./i18n";
import styled from "styled-components";

export const DevTool = () => {
  const { fontSize, scaleFactor, setFontSize, setScaleFactor } = useStore();
  const layers = ["layer1", "layer2", "layer3"] as const;
  const scaleFactors = ["min", "max", "zoom"] as const;

  return (
    <Form>
      <Title>DevTool</Title>
      <Panel>
        <Header>{i18n("Font Sizes")}</Header>
        {layers.map((layer, index) => (
          <P key={layer}>
            <label>
              <Label>
                {i18n("Layer")} {index+1}
              </Label>
              <input
                type="number"
                value={fontSize[layer]}
                onChange={(e) => {
                  setFontSize(layer, e.target.value);
                }}
              />
            </label>
          </P>
        ))}
      </Panel>

      <Panel>
        <Header>{i18n("Scale Factor")}</Header>
        {scaleFactors.map((factor) => (
          <P key={factor}>
            <label>
              <Label>
                {factor}
              </Label>
              <input
                type="number"
                value={scaleFactor[factor]}
                onChange={(e) => {
                  setScaleFactor(factor, e.target.value);
                }}
              />
            </label>
          </P>
        ))}
      </Panel>
    </Form>
  );
};


const Form = styled.form`
    color: #333;
    padding: 8px;
`

const Panel = styled.div`
  margin: 24px 0 8px
`

const Title = styled.h2`
    margin: 4px 0 12px;
`

const Header = styled.h3`
  margin: 4px 0 8px;
`

const P = styled.p`
  margin: 4px 0 8px;
`

const Label = styled.div`
    display: block;
    margin-bottom: 4px; 
`
