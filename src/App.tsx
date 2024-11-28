import { useEffect, useState } from "react";
import Map from "./Map";
import { init } from "./js/main";
import map from "../asset/foreground.svg?parse";
import { eventBus, Events } from "./event-bus.ts";
import { scaleLinear } from "d3";

let isInitialized = false;

function App() {
  // Ensure the init function is called only once, even in React strict mode
  useEffect(() => {
    if (isInitialized) return;
    init();
    isInitialized = true;
  }, []);
  const [{ xScale, yScale, zoom, visibility }, setScale] = useState<Events['labelsUpdate']>({
    visibility: [0, 0, 0],
    xScale: scaleLinear(),
    yScale: scaleLinear(),
    zoom: 1,
  });

  useEffect(() => {
    eventBus.on("labelsUpdate", ({ xScale, yScale, zoom, visibility }) => {
      setScale({
        visibility,
        xScale: xScale,
        yScale: yScale,
        zoom: zoom,
      });
    })

    return () => {
      eventBus.off("labelsUpdate");
    };
  }, []);

  return (
    <>
      <div id="article" className="content">
        <div id="article-content"></div>
      </div>

      <div id="chart">
        <div id="chart-d3"></div>
        <div id="foreground">
          <Map
            map={map} scale={{ x: xScale, y: yScale }} zoom={zoom} visibility={visibility}
          />
        </div>
      </div>

      <div id="loading" className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    </>
  );
}

export default App;
