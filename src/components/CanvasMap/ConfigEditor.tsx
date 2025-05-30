import styled from "styled-components";
import { useShallow } from "zustand/react/shallow";
import { Threshold, useConfigStore } from "./store.ts";

export const ConfigEditor = () => {
  const [
    thresholds,
    size,
    blur,
    oneBitMode,
    oneBitThreshold,
    setThresholds,
    setSize,
    setBlur,
    setOneBitThreshold,
    setOneBitMode,
  ] = useConfigStore(
    useShallow((s) => [
      s.thresholds,
      s.size,
      s.blur,
      s.oneBitMode,
      s.oneBitThreshold,
      s.setThresholds,
      s.setSize,
      s.setBlur,
      s.setOneBitThreshold,
      s.setOneBitMode,
    ]),
  );

  const update = (
    index: number,
    field: keyof Threshold,
    value: number | boolean,
  ) => {
    const newConfig = thresholds.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item,
    );
    setThresholds(newConfig);
  };

  const addRow = () =>
    setThresholds([...thresholds, { min: 0, size: 1, visible: true }]);

  const removeRow = (index: number) => {
    const newConfig = thresholds.filter((_, i) => i !== index);
    setThresholds(newConfig);
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
                setSize({ ...size, width: +e.target.value });
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
                setSize({ ...size, height: +e.target.value });
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
            type="range"
            min={0}
            value={blur}
            onChange={(e) => {
              e.preventDefault();
              const blurRadius = +e.target.value;
              setBlur(blurRadius);
            }}
          />
          <span>{blur}</span>
        </FormControl>
      </Section>

      <Section>
        <Header>
          1-bit color mode
          <InlineCheckbox
            type="checkbox"
            checked={oneBitMode}
            onChange={(e) => {
              setOneBitMode(e.target.checked);
            }}
          />
        </Header>
        <FormControl>
          <input
            disabled={!oneBitMode}
            placeholder="One bit threshold"
            type="range"
            min={0}
            max={255}
            step={10}
            value={oneBitThreshold}
            onChange={(e) => {
              e.preventDefault();
              const oneBitThreshold = +e.target.value;
              setOneBitThreshold(oneBitThreshold);
            }}
          />
          <span>{oneBitThreshold}</span>
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

  input {
    vertical-align: middle;
  }

  input[disabled] {
    color: #999;
  }

  span {
    margin-left: 8px;
    vertical-align: middle;
  }
`;

const Header = styled.h2`
  margin: 16px 0 8px;
  font-size: 16px;
`;

const InlineCheckbox = styled.input`
  margin-left: 8px;
  vertical-align: middle;
`;

export default ConfigEditor;
