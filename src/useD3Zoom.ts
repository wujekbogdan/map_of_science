import { useEffect, useRef, useState, RefObject } from "react";
import {
  D3ZoomEvent,
  select,
  zoom as d3Zoom,
  zoomIdentity,
  ZoomTransform,
} from "d3";

type Zoom = {
  x: number;
  y: number;
  scale: number;
};

export const useD3Zoom = (
  svg: RefObject<SVGSVGElement>,
  initialZoom: Zoom,
  initialized?: () => void,
) => {
  const zoomBehavior = useRef<ReturnType<
    typeof d3Zoom<SVGSVGElement, unknown>
  > | null>(null);
  const hasInitialized = useRef(false);
  const hasZoomed = useRef(false);
  const [transform, setTransform] = useState<ZoomTransform>();
  const zoom = transform ? transform.k : 1;

  useEffect(() => {
    if (hasInitialized.current) return;
    if (!svg.current) return;

    zoomBehavior.current = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 50])
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setTransform(event.transform);
      });

    select<SVGSVGElement, unknown>(svg.current).call(zoomBehavior.current);
    hasInitialized.current = true;
  });

  useEffect(() => {
    if (hasZoomed.current) return;
    if (!svg.current || !zoomBehavior.current) return;

    const center = {
      x: initialZoom.x,
      y: initialZoom.y,
    };
    zoomTo(center.x, center.y, 1, false, () => {
      initialized?.();
    });
    hasZoomed.current = true;
  });

  const zoomTo = (
    x: number,
    y: number,
    scale: number,
    animate = true,
    onEnd?: () => void,
  ) => {
    if (!svg.current || !zoomBehavior.current) return;

    const selection = select(svg.current);
    const transform = zoomIdentity.translate(x, y).scale(scale);
    const duration = animate ? 300 : 0;

    selection
      .transition()
      .duration(duration)
      .call((sel) => {
        if (!zoomBehavior.current) return; // Isn't really required because we check it above, but it makes TS happy.
        zoomBehavior.current.transform(sel, transform);
      })
      .on("end", () => {
        onEnd?.();
      });
  };

  return {
    zoom,
    zoomTo,
    transform,
  };
};
