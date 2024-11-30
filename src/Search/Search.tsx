import { MapSvgRepresentation } from "../../vite-plugin/svg-map-parser.ts";
import { useState, FormEvent } from "react";

type Props = {
  map: MapSvgRepresentation;
};

export const Search = (props: Props) => {
  const [searchTerm, setSearchTerm] = useState("");

  const { map } = props;
  const instance = new ComlinkSharedWorker<typeof import("./search.ts")>(
    new URL("./search.ts", import.meta.url),
  );

  const doWork = async (phrase: string) => {
    console.log(await instance.search(map, phrase));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    doWork(searchTerm).then((result) => {
      console.log(result);
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px",
      }}
    >
      <p>
        <input
          type="search"
          id="search"
          name="search"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
        />
      </p>
      <p>
        <button type="submit">Search</button>
      </p>
    </form>
  );
};
