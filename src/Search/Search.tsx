import { MapSvgRepresentation as Map } from "../../vite-plugin/svg-map-parser.ts";
import { useState, useMemo } from "react";
import useSWR from "swr";
import { Dropdown } from "./Dropdown.tsx";
import debounce from "lodash/debounce";

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

  const dropdownOptions = results.map(({ id, label }) => ({
    id,
    label,
  }));

  const onInput = useMemo(
    () =>
      debounce(
        (query: string) => {
          console.log("searching for", query);
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

  return (
    <form
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px",
      }}
    >
      <Dropdown
        options={dropdownOptions}
        onInput={onInput}
        onSelect={(option) => {
          console.log("selected", option);
        }}
      />
    </form>
  );
};
