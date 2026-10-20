"use client";

import { useEffect, useState } from "react";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const SearchInput = ({
  initialValue,
  onSearch,
  placeholder = "Search...",
  className,
}: {
  initialValue: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const [search, setSearch] = useState(initialValue);
  // Text appears in the input instantly, but the value is debounced
  const handleSearch = useDebouncedCallback(
    (value: string) => {
      onSearch(value);
    },
    { wait: 300 },
  );

  // If initialValue changes we need to update the state to match
  useEffect(() => {
    setSearch(initialValue);
  }, [initialValue]);

  return (
    <InputGroup className={cn(className)}>
      <InputGroupInput
        placeholder={placeholder}
        value={search}
        onChange={(e) => {
          const value = e.target.value;
          setSearch(value);
          handleSearch(value);
        }}
      />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
};
