import {
  Combobox,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@headlessui/react";
import { ChangeEvent, useState } from "react";
import { normalizeSync } from "normalize-diacritics";

type Option = {
  label: string;
  id: string;
};

type Dropdown = {
  options: Option[];
  onSelect: (option: Option) => void;
  onInput: (query: string) => void;
};

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

  const onQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSelection(null);
    setQuery(query);
    props.onInput(query);
  };

  const onSelectionChange = (selection: Option | null) => {
    if (!selection) return;

    setSelection(selection);
    setQuery(selection.label);
    props.onSelect(selection);
  };

  return (
    <Combobox value={selection} onChange={onSelectionChange}>
      <ComboboxInput
        onChange={onQueryChange}
        displayValue={(option: Option | null) => option?.label || query}
      />
      <ComboboxOptions>
        {options.map((option) => (
          <ComboboxOption key={option.id} value={option}>
            {option.label}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
};
