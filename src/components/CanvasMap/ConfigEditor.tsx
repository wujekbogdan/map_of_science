import styled from "styled-components";
import { ConfigEntry } from "./drawOnCanvas.ts";

type Size = {
  width: number;
  height: number;
};

type Props = {
  config: ConfigEntry[];
  size: Size;
  onConfigChange: (config: ConfigEntry[]) => void;
  onSizeChange: (size: Size) => void;
};

export const ConfigEditor = ({
  config,
  size,
  onConfigChange,
  onSizeChange,
}: Props) => {
  const update = (index: number, field: keyof ConfigEntry, value: number) => {
    const newConfig = [...config];
    newConfig[index] = { ...newConfig[index], [field]: value };
    onConfigChange(newConfig);
  };

  const addRow = () => onConfigChange([...config, { min: 0, size: 1 }]);

  const removeRow = (index: number) => {
    const newConfig = config.filter((_, i) => i !== index);
    onConfigChange(newConfig);
  };

  return (
    <Form>
      <Section>
        <h2>Threshold / size</h2>
        {config.map((entry, i) => (
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
        <h2>Canvas size</h2>
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
    </Form>
  );
};

const Form = styled.form`
  padding: 10px;
  background: rgba(255, 255, 255, 0.8);
`;

const Section = styled.section`
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

export default ConfigEditor;
