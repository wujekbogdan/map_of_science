import styled from "styled-components";
import { ConfigEntry } from "./drawOnCanvas.ts";

type Props = {
  config: ConfigEntry[];
  onChange: (config: ConfigEntry[]) => void;
};

export const ConfigEditor = ({ config, onChange }: Props) => {
  const update = (index: number, field: keyof ConfigEntry, value: number) => {
    const newConfig = [...config];
    newConfig[index] = { ...newConfig[index], [field]: value };
    onChange(newConfig);
  };

  const addRow = () => onChange([...config, { min: 0, size: 1 }]);

  const removeRow = (index: number) => {
    const newConfig = config.filter((_, i) => i !== index);
    onChange(newConfig);
  };

  return (
    <Form>
      {config.map((entry, i) => (
        <Row key={i}>
          <FormControl>
            <input
              placeholder="Threshold"
              type="number"
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
    </Form>
  );
};

const Form = styled.form`
  padding: 10px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const FormControl = styled.div`
  margin-right: 8px;
  flex: 1;
`;

export default ConfigEditor;
