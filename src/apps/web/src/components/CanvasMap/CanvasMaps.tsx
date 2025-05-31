import { useMemo, createRef, useState } from "react";
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

const CanvasMaps = () => {
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    k: 1,
  });
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

  const stores = useMemo(() => {
    return COLORS.map((color) => defineStore(color)).map((store, index) => ({
      store,
      name: `Map ${index + 1}`,
      id: `map-${index + 1}`,
      ref: createRef<HTMLHeadingElement>(),
    }));
  }, []);
  const [{ store: firstStore }, ...remainingStores] = stores;
  const [size] = firstStore(useShallow((s) => [s.size]));

  return isLoading ? (
    <>Loading...</>
  ) : (
    <>
      <Menu>
        <MenuItem>
          <TogglablePanel
            header="Map 1"
            initialState="expanded"
            isDropdown={true}
          >
            <ConfigEditor store={firstStore} />
          </TogglablePanel>
        </MenuItem>
        {remainingStores.map(({ name, id, store }) => (
          <MenuItem key={id}>
            <TogglablePanel
              header={name}
              initialState="collapsed"
              key={id}
              isDropdown={true}
            >
              <ConfigEditor store={store} />
            </TogglablePanel>
          </MenuItem>
        ))}
      </Menu>

      <Maps>
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
        {remainingStores.map(({ store, id, name }, index) => (
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
              name={name}
              fixed={{
                size,
                transform,
              }}
            />
          </Layer>
        ))}
      </Maps>
    </>
  );
};

const Menu = styled.div`
  z-index: 10;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  width: 100%;
`;

const MenuItem = styled.div`
  position: relative;
  flex: 1;
  z-index: 1;
`;

const Maps = styled.div`
  position: relative;
`;

const Layer = styled.div`
  position: absolute;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
`;

export default CanvasMaps;
