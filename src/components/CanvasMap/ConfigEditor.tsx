import styled from "styled-components";
import { Threshold } from "./drawOnCanvas.ts";

type Size = {
  width: number;
  height: number;
};

type Props = {
  thresholds: Threshold[];
  size: Size;
  blur: number;
  onThresholdsChange: (config: Threshold[]) => void;
  onSizeChange: (size: Size) => void;
  onBlurChange: (blur: number) => void;
};

export const ConfigEditor = ({
  thresholds,
  size,
  onThresholdsChange,
  onSizeChange,
  onBlurChange,
}: Props) => {
  const update = (
    index: number,
    field: keyof Threshold,
    value: number | boolean,
  ) => {
    const newConfig = [...thresholds];
    newConfig[index] = { ...newConfig[index], [field]: value };
    onThresholdsChange(newConfig);
  };

  const addRow = () =>
    onThresholdsChange([...thresholds, { min: 0, size: 1, visible: true }]);

  const removeRow = (index: number) => {
    const newConfig = thresholds.filter((_, i) => i !== index);
    onThresholdsChange(newConfig);
  };

  return (
    <Form>
      <Section>
        <Header>Threshold / size</Header>
        {thresholds.map((entry, i) => (
          <Row key={i}>
            <FormControl>
              <input
                placeholder="Threshold"
                type="number"
                min={1}
                value={entry.min}
                onChange={(e) => {
                  e.preventDefault();
                  update(i, "min", +e.target.value);
                }}
              />
            </FormControl>
            <FormControl>
              <input
                placeholder="Size"
                type="number"
                min={1}
                value={entry.size}
                onChange={(e) => {
                  e.preventDefault();
                  update(i, "size", +e.target.value);
                }}
              />
            </FormControl>
            <FormControl>
              <input
                type="checkbox"
                checked={entry.visible}
                onChange={(e) => {
                  update(i, "visible", e.target.checked);
                }}
              />
            </FormControl>
            <FormControl>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeRow(i);
                }}
              >
                ×
              </button>
            </FormControl>
          </Row>
        ))}

        <button
          onClick={(e) => {
            e.preventDefault();
            addRow();
          }}
        >
          + Add
        </button>
      </Section>

      <Section>
        <Header>Canvas size</Header>
        <Row>
          <FormControl>
            <input
              placeholder="Width"
              type="number"
              min={1}
              value={size.width}
              onChange={(e) => {
                e.preventDefault();
                onSizeChange({ ...size, width: +e.target.value });
              }}
            />
          </FormControl>
          <FormControl>
            <input
              placeholder="Height"
              type="number"
              min={1}
              value={size.height}
              onChange={(e) => {
                e.preventDefault();
                onSizeChange({ ...size, height: +e.target.value });
              }}
            />
          </FormControl>
        </Row>
      </Section>

      <Section>
        <Header>Blur</Header>
        <FormControl>
          <input
            placeholder="Blur radius"
            type="number"
            min={0}
            defaultValue={0}
            onChange={(e) => {
              e.preventDefault();
              const blurRadius = +e.target.value;
              onBlurChange(blurRadius);
            }}
          />
        </FormControl>
      </Section>
    </Form>
  );
};

const Form = styled.form``;

const Section = styled.div`
  margin-top: 24px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const FormControl = styled.div`
  margin-right: 8px;
`;

const Header = styled.h2`
  margin: 16px 0 8px;
  font-size: 16px;
`;

export default ConfigEditor;
