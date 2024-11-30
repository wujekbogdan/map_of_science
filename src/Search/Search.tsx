import { useState, useMemo } from "react";
import debounce from "lodash/debounce";
import useSWR from "swr";
import { MapSvgRepresentation as Map } from "../../vite-plugin/svg-map-parser.ts";
import { Dropdown, Option } from "./Dropdown.tsx";

const worker = new ComlinkSharedWorker<typeof import("./search.ts")>(
  new URL("./search.ts", import.meta.url),
);

type Props = {
  map: Map;
};

export const Search = (props: Props) => {
  const { map } = props;

  const [searchTerm, setSearchTerm] = useState("");

  const { data: results = [] } = useSWR(
    searchTerm ? [map, searchTerm] : null,
    ([map, query]) => {
      if (!query) return [];
      return worker.search(map, query);
    },
  );

  const dropdownOptions = results.map(({ id, label, center }) => ({
    id,
    label,
    x: center.x,
    y: center.y,
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

  const onSelectionChange = (option: Option) => {
    console.log("Selected:", option);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px",
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
    </form>
  );
};
