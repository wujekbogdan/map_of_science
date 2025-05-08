import { useEffect, useState } from "react";
import debounce from "lodash/debounce";

type WindowSize = {
  width: number;
  height: number;
};

export const useWindowSize = (onResize: (windowSize: WindowSize) => void) => {
  const measure = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [size, setSize] = useState(measure());

  useEffect(() => {
    // So that it triggers at least once on mount.
    onResize(measure());

    const onResizeHandler = debounce(() => {
      const windowSize = measure();
      setSize(windowSize);
      onResize(windowSize);
    }, 100);

    window.addEventListener("resize", onResizeHandler);

    return () => {
      onResizeHandler.cancel();
      window.removeEventListener("resize", onResizeHandler);
    };
  }, [onResize]);

  return size;
};
