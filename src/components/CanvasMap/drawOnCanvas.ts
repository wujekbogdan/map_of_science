import * as d3 from "d3";
import { DataPoint } from "../../api/model";

export type Threshold = {
  min: number;
  size: number;
  visible: boolean;
};

type Props = {
  canvas?: OffscreenCanvas;
  width: number;
  height: number;
  data: DataPoint[];
  thresholds: Threshold[];
  blur: number;
};

let cachedCanvas: OffscreenCanvas | null = null;

export const drawOnCanvas = (props: Props) => {
  const canvas = cachedCanvas ?? props.canvas;

  if (!canvas) {
    throw new Error("Canvas is not provided or initialized");
  }

  cachedCanvas = canvas;
  const { width, height, data, thresholds, blur } = props;
  const sortedThresholds = [...thresholds].sort((a, b) => a.min - b.min);

  const findThreshold = (num: number) => {
    const found = sortedThresholds.findLast((item) => num >= item.min);
    return found ?? { size: 1, visible: true };
  };

  const mainCtx = canvas.getContext("2d");

  if (!mainCtx) {
    throw new Error("Cannot initialize canvas context");
  }

  console.time("canvasMap");

  canvas.width = width;
  canvas.height = height;

  const xExtent = d3.extent(data, (d) => d.x) as [number, number];
  const yExtent = d3.extent(data, (d) => d.y) as [number, number];

  const dataWidth = xExtent[1] - xExtent[0];
  const dataHeight = yExtent[1] - yExtent[0];

  const scale = Math.min(width / dataWidth, height / dataHeight);

  const viewWidth = width / scale;
  const viewHeight = height / scale;

  const xScale = d3
    .scaleLinear()
    .domain([-viewWidth / 2, viewWidth / 2])
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain([-viewHeight / 2, viewHeight / 2])
    .range([0, height]);

  console.time("render");
  const tempCanvas = new OffscreenCanvas(width, height);
  const tempCtx = tempCanvas.getContext("2d")!;

  data.forEach((point) => {
    const config = findThreshold(point.numRecentArticles);

    if (!config.visible) {
      return;
    }

    tempCtx.beginPath();
    tempCtx.arc(xScale(point.x), yScale(point.y), config.size, 0, 2 * Math.PI);
    tempCtx.fillStyle = "black";
    tempCtx.fill();
  });

  mainCtx.clearRect(0, 0, width, height);
  mainCtx.save();
  mainCtx.filter = blur ? `blur(${blur}px)` : "none";
  mainCtx.drawImage(tempCanvas, 0, 0);
  mainCtx.restore();

  console.timeEnd("canvasMap");
};
