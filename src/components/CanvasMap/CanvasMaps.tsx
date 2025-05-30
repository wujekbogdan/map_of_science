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
      <Menu>
        {stores.map(({ id, name, ref }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                ref.current?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              {name}
            </a>
          </li>
        ))}
      </Menu>
      <Maps>
        {stores.map(({ store, id, name, ref }) => (
          <>
            <h1 ref={ref}>{name}</h1>
            <CanvasMap key={id} data={dataAsArray} store={store} />
          </>
        ))}
      </Maps>
    </>
  );
};

const Menu = styled.ul`
  z-index: 1;
  background: #fff;
  position: fixed;
  padding: 10px;
  margin: 0;
  resize: none;
  right: 50%;
  transform: translateX(50%);
  top: 0;
  text-align: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);

  li {
    display: inline-block;
    margin: 0 10px;
  }
`;

const Maps = styled.div`
  margin-top: 24px;
`;

export default CanvasMaps;
