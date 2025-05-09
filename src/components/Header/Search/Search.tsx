import debounce from "lodash/debounce";
import { useState, useMemo } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { useShallow } from "zustand/react/shallow";
import { MapSvgRepresentation as Map } from "../../../../vite-plugin/svg-map-parser.ts";
import { useStore } from "../../../store.ts";
import { Dropdown, Option } from "./Dropdown.tsx";

const worker = new ComlinkSharedWorker<typeof import("./search.ts")>(
  new URL("./search.ts", import.meta.url),
);

type Props = {
  map: Map;
};

export const Search = (props: Props) => {
  const { map } = props;
  const [setDesiredZoom, mapSize] = useStore(
    useShallow((s) => [s.setDesiredZoom, s.mapSize]),
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { data: results = [] } = useSWR(
    searchTerm ? [map, searchTerm] : null,
    ([map, query]) => {
      if (!query) return [];
      return worker.search(map, query);
    },
  );

  const dropdownOptions = results.map(({ id, label, boundingBox }) => ({
    id,
    label,
    boundingBox,
  }));

  const onInput = useMemo(
    () =>
      debounce(
        (query: string) => {
          if (query.length < 3) {
            setSearchTerm("");
            return;
          }

          setSearchTerm(query);
        },
        300,
        { leading: true },
      ),
    [],
  );

  const zoomTo = (bbox: Option["boundingBox"]) => {
    const boxWidth = bbox.max.x - bbox.min.x;
    const boxHeight = bbox.max.y - bbox.min.y;

    const zoomX = mapSize.width / boxWidth;
    const zoomY = mapSize.height / boxHeight;

    const zoom = Math.min(zoomX, zoomY); // fit entire box

    const x = -bbox.center.x * zoom + mapSize.width / 2;
    const y = -bbox.center.y * zoom + mapSize.height / 2;

    setDesiredZoom({
      x,
      y,
      scale: zoom,
    });
  };

  const onSelectionChange = (option: Option) => {
    console.log(option.label);
    zoomTo(option.boundingBox);
  };

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <Dropdown
        // TODO: passing SWR isLoading doesn't make sense because loading is too
        // fast. It's only causing the dropdown to flicker.
        // Ideally, we should show the loading indicator only when search already
        // took some time e.g. 0.3s or so.
        // SWR `onLoadingSlow` could be used for that.
        isLoading={false}
        options={dropdownOptions}
        onInput={onInput}
        onSelect={onSelectionChange}
      />
    </Form>
  );
};

const Form = styled.form`
  width: 450px;
`;
