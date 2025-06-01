import { useMemo, useState } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import { loadData } from "../../api/worker.ts";
import { useStore } from "../../store.ts";
import TogglablePanel from "../TogglablePanel/TogglablePanel.tsx";
import CanvasMap from "./CanvasMap.tsx";
import ConfigEditor from "./ConfigEditor.tsx";
import { defineStore } from "./store.ts";

const COLORS = ["#d8edd0", "#a3cd93", "#7aba5e", "#5db43d", "#4a9131"];
const allStores = COLORS.map((color) => defineStore(color));

type HeaderProps = {
  header: string;
  onToggle?: (enabled: boolean) => void;
};

const Header = (props: HeaderProps) => {
  return (
    <MapToggle>
      <label htmlFor={props.header}>{props.header}</label>
      <input
        disabled={!props.onToggle}
        id={props.header}
        defaultChecked={true}
        type="checkbox"
        onChange={(event) => {
          if (!props.onToggle) return;
          props.onToggle(event.target.checked);
        }}
      />
    </MapToggle>
  );
};

const CanvasMaps = () => {
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    k: 1,
  });
  const [count, setCount] = useState(COLORS.length);
  const [visibility, setVisibility] = useState(COLORS.map(() => true));
  const [setDataPoints] = useStore(useShallow((s) => [s.setDataPoints]));
  const { data, isLoading } = useSWR("data", loadData, {
    onSuccess: ({ dataPoints }) => {
      setDataPoints(dataPoints);
    },
  });
  const dataAsArray = useMemo(() => {
    if (!data?.dataPoints) return [];
    return Array.from(data.dataPoints.values());
  }, [data?.dataPoints]);
  const toggleVisibility = (index: number, visible: boolean) => {
    setVisibility((prev) => prev.map((v, i) => (i === index ? visible : v)));
  };

  const stores = useMemo(() => {
    return allStores.slice(0, count).map((store, index) => ({
      store,
      header: (
        <>
          <Header
            header={`Layer ${index + 1}`}
            onToggle={(visibility) => {
              toggleVisibility(index, visibility);
            }}
          />
        </>
      ),
      id: `map-${index + 1}`,
      visible: visibility[index],
    }));
  }, [count, visibility]);
  const [{ store: firstStore }, ...remainingStores] = stores;
  const [size] = firstStore(useShallow((s) => [s.size]));

  const onReset = () => {
    allStores.forEach((store) => {
      store.setState((prev) => ({
        ...prev,
        size: { width: 1000, height: 1000 },
        transform: { x: 0, y: 0, k: 1 },
      }));
    });
  };

  return isLoading ? (
    <>Loading...</>
  ) : (
    <>
      <Menu>
        <Items>
          <MenuItem>
            <TogglablePanel
              mode="hover"
              header={<Header header="Layer 1" />}
              initialState="collapsed"
              isDropdown={true}
            >
              <EditorContainer>
                <ConfigEditor store={firstStore} />
              </EditorContainer>
            </TogglablePanel>
          </MenuItem>
          {remainingStores.map(({ header, id, store }) => (
            <MenuItem key={id}>
              <TogglablePanel
                mode="hover"
                header={header}
                initialState="collapsed"
                key={id}
                isDropdown={true}
              >
                <EditorContainer>
                  <ConfigEditor store={store} />
                </EditorContainer>
              </TogglablePanel>
            </MenuItem>
          ))}
        </Items>

        <Utils>
          <Util>
            <button id="reset" onClick={onReset}>
              Reset zoom/position
            </button>
          </Util>
          <Util>
            <label htmlFor="count">Layers count</label>
            <input
              id="count"
              value={count}
              type="number"
              min="1"
              max="5"
              onChange={(e) => {
                e.preventDefault();
                setCount(+e.target.value);
              }}
            />
          </Util>
        </Utils>
      </Menu>

      <Layers>
        <Layer
          style={{
            zIndex: COLORS.length,
          }}
        >
          <CanvasMap
            data={dataAsArray}
            store={firstStore}
            name="Map 1"
            onTransformChange={setTransform}
          />
        </Layer>
        {remainingStores
          .filter((_, index) => visibility[index + 1])
          .map(({ store, id }, index) => (
            <Layer
              key={id}
              style={{
                zIndex: remainingStores.length - index,
              }}
            >
              <CanvasMap
                key={id}
                data={dataAsArray}
                store={store}
                name={id}
                fixed={{
                  size,
                  transform,
                }}
              />
            </Layer>
          ))}
      </Layers>
    </>
  );
};

const MapToggle = styled.div`
  display: flex;

  label {
    margin: 0 8px 0 auto;
  }
`;

const Utils = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 8px;
`;

const Util = styled.div`
  margin-left: 8px;
  display: flex;
  align-items: center;

  label {
    margin: 0 8px 0 auto;
  }
`;

const Menu = styled.div`
  z-index: 10;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
`;

const Items = styled.div`
  display: flex;
  width: 100%;
`;

const MenuItem = styled.div`
  position: relative;
  flex: 1;
  z-index: 1;
`;

const EditorContainer = styled.div`
  background: #ededed;
`;

const Layers = styled.div`
  position: relative;
`;

const Layer = styled.div`
  position: absolute;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
`;

export default CanvasMaps;
