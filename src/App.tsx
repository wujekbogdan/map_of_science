import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import MapComponent from "./Map";
import { init } from "./js/main";
import map from "../asset/foreground.svg?parse";
import { eventBus, Events } from "./event-bus.ts";
import { DevTool } from "./DevTool.tsx";
import { config } from "./config.ts";
import { Header } from "./Header/Header.tsx";
import { i18n } from "./i18n.ts";
import { Concept } from "./schema";
import { useArticleStore, useStore } from "./store.ts";
import { useWindowSize } from "./useWindowSize.ts";
import { ArticleModal } from "./Article/ArticleModal.tsx";
import { LocalArticle } from "./Article/LocalArticle.tsx";

let isInitialized = false;

const Loader = () => {
  return <LoadingWrapper>{i18n("Ładowanie danych...")}</LoadingWrapper>;
};

function App() {
  // Ensure the init function is called only once, even in React strict mode
  useEffect(() => {
    if (isInitialized) return;
    init();
    isInitialized = true;
  }, []);

  const article = useArticleStore(({ article }) => article);
  const resetArticle = useArticleStore(({ reset }) => reset);
  const [cityLabels, setCityLabels] = useState<Events["cityLabelsLoaded"]>([]);
  const [dataPoints, setDataPoints] = useState<Events["dataPointsLoaded"]>([]);
  const [concepts, setConcepts] = useState<Map<number, Concept>>(
    new Map<number, Concept>(),
  );
  const isLoaded = dataPoints.length > 0 && concepts.size > 0;
  const setMapSize = useStore((s) => s.setMapSize);
  const size = useWindowSize(
    useCallback(
      (size: { width: number; height: number }) => {
        setMapSize(size);
      },
      [setMapSize],
    ),
  );

  // TODO: Get rid of event-based communication and rely solely on Zustand once data points rendering is fully migrated to React
  useEffect(() => {
    eventBus.on("cityLabelsLoaded", (labels) => {
      setCityLabels(labels);
    });
    eventBus.on("dataPointsLoaded", (dataPoints) => {
      setDataPoints(dataPoints);
    });
    eventBus.on("conceptsLoaded", (dataPoints) => {
      setConcepts(dataPoints);
    });

    return () => {
      eventBus.off("cityLabelsLoaded");
      eventBus.off("dataPointsLoaded");
      eventBus.off("conceptsLoaded");
    };
  }, []);

  return (
    <>
      <Header />

      {!isLoaded ? (
        <Loader />
      ) : (
        <MapComponent
          size={size}
          cityLabels={cityLabels}
          dataPoints={dataPoints}
          concepts={concepts}
          map={map}
        />
      )}

      {article && (
        <ArticleModal
          children={<LocalArticle html={article} />}
          onClose={() => {
            resetArticle();
          }}
        />
      )}

      {config.devTool && (
        <DevToolsWrapper>
          <DevTool />
        </DevToolsWrapper>
      )}
    </>
  );
}

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
