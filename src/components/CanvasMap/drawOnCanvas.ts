import { extent, scaleLinear } from "d3";
import { DataPoint } from "../../api/model";
import { Threshold } from "./store.ts";

type Props = {
  canvas?: OffscreenCanvas;
  width: number;
  height: number;
  data: DataPoint[];
  thresholds: Threshold[];
  oneBitThreshold: number;
  oneBitMode: boolean;
  blur: number;
  transform: {
    x: number;
    y: number;
    k: number;
  };
};

let cachedCanvas: OffscreenCanvas | null = null;

const toOneBit = (
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  threshold: number,
) => {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    const val = alpha >= threshold ? 0 : 255;
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
};

export const drawOnCanvas = (props: Props) => {
  const canvas = cachedCanvas ?? props.canvas;

  if (!canvas) {
    throw new Error("Canvas is not provided or initialized");
  }

  cachedCanvas = canvas;
  const {
    width,
    height,
    data,
    thresholds,
    blur,
    transform,
    oneBitThreshold,
    oneBitMode,
  } = props;
  const sortedThresholds = [...thresholds].sort((a, b) => a.min - b.min);

  const findThreshold = (num: number) => {
    const found = sortedThresholds.findLast((item) => num >= item.min);
    return found ?? { size: 1, visible: true };
  };

  const mainCtx = canvas.getContext("2d");

  if (!mainCtx) {
    throw new Error("Cannot initialize canvas context");
  }

  canvas.width = width;
  canvas.height = height;

  const xExtent = extent(data, (d) => d.x) as [number, number];
  const yExtent = extent(data, (d) => d.y) as [number, number];
  const dataWidth = xExtent[1] - xExtent[0];
  const dataHeight = yExtent[1] - yExtent[0];

  const scale = Math.min(width / dataWidth, height / dataHeight);

  const viewWidth = width / scale;
  const viewHeight = height / scale;

  const xScale = scaleLinear()
    .domain([-viewWidth / 2, viewWidth / 2])
    .range([0, width]);

  const yScale = scaleLinear()
    .domain([-viewHeight / 2, viewHeight / 2])
    .range([0, height]);

  const applyTransform = (x: number, y: number) => ({
    x: x * transform.k + transform.x,
    y: y * transform.k + transform.y,
  });

  const tempCanvas = new OffscreenCanvas(width, height);
  const tempCtx = tempCanvas.getContext("2d")!;

  data.forEach((point) => {
    const config = findThreshold(point.numRecentArticles);

    if (!config.visible) {
      return;
    }

    const { x, y } = applyTransform(xScale(point.x), yScale(point.y));

    if (x < 0 || x > width || y < 0 || y > height) {
      return;
    }

    tempCtx.beginPath();
    tempCtx.arc(x, y, config.size, 0, 2 * Math.PI);
    tempCtx.fillStyle = "black";
    tempCtx.fill();
  });

  mainCtx.clearRect(0, 0, width, height);
  mainCtx.filter = blur ? `blur(${blur}px)` : "none";
  mainCtx.drawImage(tempCanvas, 0, 0);

  if (oneBitMode) {
    toOneBit(mainCtx, width, height, oneBitThreshold);
  }
};
