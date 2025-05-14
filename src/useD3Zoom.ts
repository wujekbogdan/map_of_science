import {
  D3ZoomEvent,
  select,
  zoom as d3Zoom,
  zoomIdentity,
  ZoomTransform,
} from "d3";
import { useEffect, useRef, useState, RefObject, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "./store.ts";

type Zoom = {
  x: number;
  y: number;
  scale: number;
};

type Options = {
  svg: RefObject<SVGSVGElement>;
  initialZoom: Zoom;
  initialized?: () => void;
  desiredZoom: Zoom | null;
};

export const useD3Zoom = (options: Options) => {
  const { svg, initialZoom, initialized, desiredZoom } = options;

  const zoomBehavior = useRef<ReturnType<
    typeof d3Zoom<SVGSVGElement, unknown>
  > | null>(null);
  const hasInitialized = useRef(false);
  const hasZoomed = useRef(false);
  const [transform, setTransform] = useState<ZoomTransform>();
  const [setCurrentZoom] = useStore(useShallow((s) => [s.setCurrentZoom]));
  const zoom = transform ? transform.k : 1;

  const zoomTo = useCallback(
    (
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
    },
    [svg, zoomBehavior],
  );

  useEffect(() => {
    if (hasInitialized.current) return;
    if (!svg.current) return;

    zoomBehavior.current = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 50])
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        // TODO: consider moving transform to Zustand
        // https://github.com/wujekbogdan/map-of-science/issues/61
        setTransform(event.transform);
        setCurrentZoom({
          x: event.transform.x,
          y: event.transform.y,
          scale: event.transform.k,
        });
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

  useEffect(() => {
    if (!desiredZoom) return;

    zoomTo(desiredZoom.x, desiredZoom.y, desiredZoom.scale, true);
  }, [desiredZoom, desiredZoom?.x, desiredZoom?.y, desiredZoom?.scale, zoomTo]);

  return {
    zoom,
    zoomTo,
    transform,
  };
};
