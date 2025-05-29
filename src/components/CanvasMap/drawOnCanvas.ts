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
  console.log("draw");
  const canvas = cachedCanvas ?? props.canvas;

  if (!canvas) {
    throw new Error("Canvas is not provided or initialized");
  }

  cachedCanvas = canvas;
  const { width, height, data, config } = props;
  const ctx = canvas.getContext("2d");
  const getCircleSize = (num: number) => {
    const sortedConfig = [...config].sort((a, b) => a.min - b.min);

    for (const c of sortedConfig) {
      if (num >= c.min) return c.size;
    }
    return 1;
  };

  if (!ctx) {
    throw new Error("Cannot initialize canvas context");
  }

  console.time("canvasMap");
  const xExtent = d3.extent(data, (d) => d.x) as [number, number];
  const yExtent = d3.extent(data, (d) => d.y) as [number, number];
  const maxExtent = Math.max(xExtent[1] - xExtent[0], yExtent[1] - yExtent[0]);
  const halfExtent = maxExtent / 2;

  const xScale = d3
    .scaleLinear()
    .domain([-halfExtent, halfExtent])
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain([-halfExtent, halfExtent])
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
