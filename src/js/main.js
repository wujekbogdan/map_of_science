import * as points from "./points.js";

import "../css/annotation.css";
import "../css/article.css";
import "../css/chart.css";
import "../css/common.css";
import "../css/content.css";
import "../css/labels.css";
import "../css/loading.css";

import "animate.css";

export const init = () => {
  function enableLoadingScreen() {
    document.getElementById("loading").style.display = "block";
    document.getElementById("chart").style.display = "none";
  }

  enableLoadingScreen();
  points.loadConcepts();
  points.loadDataPoints();
};
