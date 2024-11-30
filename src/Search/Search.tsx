import { MapSvgRepresentation } from "../../vite-plugin/svg-map-parser.ts";
import { useState, useEffect } from "react";
import { Model as SearchResults } from "./search.ts";
import { Dropdown } from "./Dropdown.tsx";

const worker = new ComlinkSharedWorker<typeof import("./search.ts")>(
  new URL("./search.ts", import.meta.url),
);

type Props = {
  map: MapSvgRepresentation;
};

export const Search = (props: Props) => {
  const { map } = props;

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResults>([]);

  const dropdownOptions = results.map(({ id, label }) => ({
    id,
    label,
  }));

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    worker.search(map, searchTerm).then((results) => {
      setResults(results);
    });
  }, [map, searchTerm]);

  const onInput = (query: string) => {
    setSearchTerm(query);
  };

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
