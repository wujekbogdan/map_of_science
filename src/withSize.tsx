import { ComponentType, useEffect, useState } from "react";
import debounce from "lodash/debounce";

export const withSize = <P extends { size: { width: number; height: number } }>(
  Component: ComponentType<P>,
) => {
  return (props: Omit<P, "size">) => {
    const measure = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const [size, setSize] = useState(measure());

    useEffect(() => {
      const onResize = debounce(() => {
        setSize(measure());
      }, 100);

      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
      };
    }, []);

    return <Component {...(props as P)} size={size} />;
  };
};