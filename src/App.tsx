import { useEffect, useState } from "react";
import { scaleLinear } from "d3";
import styled from "styled-components";
import Map from "./Map";
import { init } from "./js/main";
import map from "../asset/foreground.svg?parse";
import { eventBus, Events } from "./event-bus.ts";
import { DevTool } from "./DevTool.tsx";
import { config } from "./config.ts";
import { useStore } from "./store.ts";
import { Header } from "./Header/Header.tsx";
import { i18n } from "./i18n.ts";

let isInitialized = false;

function App() {
  const { setZoom } = useStore();

  // Ensure the init function is called only once, even in React strict mode
  useEffect(() => {
    if (isInitialized) return;
    init();
    isInitialized = true;
  }, []);
  // TODO: consider moving the state to the store
  const [{ xScale, yScale, zoom, visibility }, setScale] = useState<
    Events["labelsUpdate"]
  >({
    visibility: [0, 0, 0, 0],
    xScale: scaleLinear(),
    yScale: scaleLinear(),
    zoom: 1,
  });
  const [cityLabels, setCityLabels] = useState<Events["cityLabelsLoaded"]>([]);

  useEffect(() => {
    eventBus.on("labelsUpdate", ({ xScale, yScale, zoom, visibility }) => {
      setScale({
        visibility,
        xScale: xScale,
        yScale: yScale,
        zoom: zoom,
      });
      setZoom(zoom);
    });
    eventBus.on("cityLabelsLoaded", (labels) => {
      setCityLabels(labels);
    });

    return () => {
      eventBus.off("labelsUpdate");
      eventBus.off("cityLabelsLoaded");
    };
  }, [setScale, setZoom]);

  return (
    <>
      <Header />
      <div id="article" className="content">
        <div id="article-content"></div>
      </div>
      <div id="chart">
        <div id="chart-d3"></div>
        <div id="foreground">
          <Map
            cityLabels={cityLabels}
            map={map}
            scale={{ x: xScale, y: yScale }}
            zoom={zoom}
            visibility={visibility}
          />
        </div>
      </div>
      <div id="loading" className="loading-container">
        <div className="loading-spinner"></div>
        <p>{i18n("Ładowanie danych...")}</p>
      </div>
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

export default App;
