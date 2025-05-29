import * as d3 from "d3";
import { DataPoint } from "../api/model";

const config = [
  { min: 2001, size: 6 },
  { min: 1001, size: 5 },
  { min: 501, size: 5 },
  { min: 201, size: 3 },
  { min: 51, size: 2 },
  { min: 0, size: 1 },
] as const;

const getCircleSize = (num: number) => {
  for (const c of config) {
    if (num >= c.min) return c.size;
  }
  return 1;
};

type Props = {
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  data: DataPoint[];
};

export const drawOnCanvas = (props: Props) => {
  console.time("canvasMap");
  const { width, height, canvas, data } = props;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Cannot initialize canvas context");
  }

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2); // Center 0,0

  data.forEach((point) => {
    ctx.beginPath();
    ctx.arc(
      point.x,
      point.y,
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
