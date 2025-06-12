import { useCallback } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import map from "../../asset/foreground.svg?parse";
import { loadData } from "../api/worker.ts";
import { config } from "../config.ts";
import { i18n } from "../i18n.ts";
import { useStore } from "../store.ts";
import { useWindowSize } from "../useWindowSize.ts";
import { Article } from "./Article/Article.tsx";
import { DevTool } from "./DevTool.tsx";
import { Header } from "./Header/Header.tsx";
import MapComponent from "./Map";

const Loader = () => {
  return <LoadingWrapper>{i18n("Ładowanie danych...")}</LoadingWrapper>;
};

function App() {
  const [setMapSize, setDataPoints, setConcepts] = useStore(
    useShallow((s) => [s.setMapSize, s.setDataPoints, s.setConcepts]),
  );
  const { data, isLoading } = useSWR("data", loadData, {
    onSuccess: ({ dataPoints, concepts }) => {
      setDataPoints(dataPoints);
      setConcepts(concepts);
    },
  });

  const size = useWindowSize(
    useCallback(
      (size: { width: number; height: number }) => {
        setMapSize(size);
      },
      [setMapSize],
    ),
  );

  return (
    <Container>
      <Header />

      {isLoading ? (
        <Loader />
      ) : (
        <MapComponent
          size={size}
          /* TODO: This condition isn't really required. values are never
           * undefined. It's just an issue with SWR typing. SWR doesn't narrow
           * the type of data based on the isLoading value.
           * */
          cityLabels={data?.cityLabels ?? []}
          dataPoints={data?.dataPoints ?? new Map()}
          concepts={data?.concepts ?? new Map()}
          youtube={data?.youtube ?? new Map()}
          map={map}
        />
      )}

      <Article />

      {config.devTool && (
        <DevToolsWrapper>
          <DevTool />
        </DevToolsWrapper>
      )}
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  background: radial-gradient(
    circle,
    rgba(173, 216, 230, 0.7) 0,
    rgba(173, 216, 230, 1) 100%
  );
`;

const DevToolsWrapper = styled.div`
  z-index: 20;
  position: fixed;
  bottom: 0;
  right: 0;
`;

const LoadingWrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

export default App;
