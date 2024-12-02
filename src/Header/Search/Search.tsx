import { useState, useMemo } from "react";
import styled from "styled-components";
import debounce from "lodash/debounce";
import useSWR from "swr";
import { MapSvgRepresentation as Map } from "../../../vite-plugin/svg-map-parser.ts";
import { Dropdown, Option } from "./Dropdown.tsx";
import { zoomTo } from "../../js/chart";

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

  const onSelectionChange = (option: Option) => {
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
  width: 100%;
  max-width: 450px;
`;
