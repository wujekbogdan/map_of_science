import { useMemo, createRef } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import { loadData } from "../../api/worker.ts";
import { useStore } from "../../store.ts";
import CanvasMap from "./CanvasMap.tsx";
import { defineStore } from "./store.ts";

const CanvasMaps = () => {
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

  const COUNT = 6;
  const stores = useMemo(() => {
    return Array.from({ length: COUNT }, () => defineStore()).map(
      (store, index) => ({
        store,
        name: `Map ${index + 1}`,
        id: `map-${index + 1}`,
        ref: createRef<HTMLHeadingElement>(),
      }),
    );
  }, []);

  return isLoading ? (
    <>Loading...</>
  ) : (
    <>
      <Maps>
        {stores.map(({ store, id, name }) => (
          <>
            <CanvasMap key={id} data={dataAsArray} store={store} name={name} />
          </>
        ))}
      </Maps>
    </>
  );
};

const Maps = styled.div`
  margin-top: 24px;
`;

export default CanvasMaps;
