import {
  Combobox,
  ComboboxInput as ComboboxInputHeadless,
  ComboboxOptions as ComboboxOptionsHeadless,
  ComboboxOption as ComboboxOptionHeadless,
} from "@headlessui/react";
import { normalizeSync } from "normalize-diacritics";
import { ChangeEvent, useMemo, useState } from "react";
import styled from "styled-components";
import { i18n } from "../../i18n.ts";

export type Option = {
  label: string;
  id: string;
  boundingBox: {
    min: { x: number; y: number };
    max: { x: number; y: number };
    center: { x: number; y: number };
  };
};

type Dropdown = {
  options: Option[];
  onSelect: (option: Option) => void;
  onInput: (query: string) => void;
  isLoading: boolean;
};

const placeholders = [
  "fizyka kwantowa",
  "genetyka",
  "chemia organiczna",
  "bioreaktory",
  "energetyka",
  "rybołówstwo",
  "prawo międzynarodowe",
  "ekonomia behawioralna",
  "cyberbezpieczeństwo",
  "logika rozmyta",
];

export const Dropdown = (props: Dropdown) => {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Option | null>(null);
  const options = query
    ? props.options.filter((option) =>
        normalizeSync(option.label.toLowerCase()).includes(
          normalizeSync(query.toLowerCase()),
        ),
      )
    : props.options;
  const hasNoResultsText = query.length > 1 && options.length === 0;
  const noResultsText = (() => {
    if (query.length < 3) {
      return i18n("Wpisz co najmniej 3 znaki");
    }

    if (props.isLoading) {
      return i18n("Ładowanie...");
    }

    return i18n("Brak wyników");
  })();
  const randomPlaceholder = useMemo(
    () => placeholders[Math.floor(Math.random() * placeholders.length)],
    // ESLint is incorrect here. Memoizing the function based on `query`
    // ensures that the placeholder does not change on every render.
    // The fact that `query` is not used in the function is irrelevant in this case.
    // Adding `query` as a dependency results in the intended behavior -
    // it re-randomizes the placeholder when the user clears the input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query],
  );

  const onQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSelection(null);
    setQuery(query);
    props.onInput(query);
  };

  const onSelectionChange = (selection: Option | null) => {
    if (!selection) return;

    setSelection(selection);
    // setQuery(selection.label);
    props.onSelect(selection);
  };

  return (
    <Combobox value={selection} onChange={onSelectionChange} immediate>
      {({ open }) => (
        <>
          <ComboboxInput
            autoComplete="off"
            $open={open}
            placeholder={i18n(
              `Wyszukaj na Mapie Nauki, np. "${randomPlaceholder}"`,
            )}
            displayValue={(option: Option | null) => option?.label || query}
            onChange={onQueryChange}
          />
          <ComboboxOptions
            anchor="bottom start"
            style={{
              width: "var(--input-width)",
            }}
          >
            {hasNoResultsText ? (
              <NoResults>{noResultsText}</NoResults>
            ) : (
              options.map((option) => (
                <ComboboxOptionHeadless key={option.id} value={option}>
                  {({ focus, selected }) => (
                    <ComboboxOption $focus={focus} $selected={selected}>
                      {option.label}
                    </ComboboxOption>
                  )}
                </ComboboxOptionHeadless>
              ))
            )}
          </ComboboxOptions>
        </>
      )}
    </Combobox>
  );
};

const ComboboxInput = styled(ComboboxInputHeadless).attrs<{
  placeholder?: string;
  autoComplete?: string;
}>((props) => ({
  type: "text",
  placeholder: props.placeholder ?? "",
  autoComplete: props.autoComplete ?? "",
}))<{ $open: boolean }>`
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

  font-size: 16px;
  box-sizing: border-box;
  position: relative;
  width: 100%;
  padding: 12px;
  border-width: ${({ $open }) => ($open ? "2px 2px 0 2px" : "2px")};
  border-style: solid;
  border-color: ${(props) =>
    props.$open ? "#9B5B9B #9B5B9B #fff #9B5B9B" : "#9B5B9B"};
  border-radius: ${({ $open }) => ($open ? "4px 4px 0 0" : "4px")};
  color: #333;
  transition: box-shadow 0.2s ease-in-out;

  &:focus {
    outline: none;
  }
`;

const ComboboxOptions = styled(ComboboxOptionsHeadless)`
  z-index: 40;
  background-color: #fff;
  box-sizing: border-box;
  border-radius: 0 0 4px 4px;
  border: 2px solid #9b5b9b;
  border-top-width: 0;
`;

const NoResults = styled.div`
  padding: 12px;
  color: #999;
`;

const ComboboxOption = styled.div<{
  $focus: boolean;
  $selected: boolean;
}>`
  color: #333;
  padding: 12px;
  background-color: ${({ $focus }) => ($focus ? "#eee" : "transparent")};
`;
