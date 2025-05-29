import * as d3 from "d3";
import { DataPoint } from "../../api/model";

export type ConfigEntry = {
  min: number;
  size: number;
};

type Props = {
  canvas?: OffscreenCanvas;
  width: number;
  height: number;
  data: DataPoint[];
  config: ConfigEntry[];
};

let cachedCanvas: OffscreenCanvas | null = null;

export const drawOnCanvas = (props: Props) => {
  const canvas = cachedCanvas ?? props.canvas;

  if (!canvas) {
    throw new Error("Canvas is not provided or initialized");
  }

  cachedCanvas = canvas;
  const { width, height, data, config } = props;

  const getCircleSize = (num: number): number => {
    const sortedConfig = [...config].sort((a, b) => a.min - b.min);
    return sortedConfig.findLast((item) => num >= item.min)?.size ?? 1;
  };

  const ctx = canvas.getContext("2d");

  if (!ctx) {
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

  ctx.clearRect(0, 0, width, height);
  ctx.save();

  data.forEach((point) => {
    ctx.beginPath();
    ctx.arc(
      xScale(point.x),
      yScale(point.y),
      getCircleSize(point.numRecentArticles),
      0,
      2 * Math.PI,
    );
    ctx.fillStyle = "black";
    ctx.fill();
  });

  ctx.restore();
  console.timeEnd("canvasMap");
};
