"use client";

import * as React from "react";
import { ChevronDown, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  value?: string;
  onChange?: (v: string) => void;
};

const orderOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "trending", label: "Trending" },
  { value: "old", label: "First Published" },
  { value: "new", label: "Most Recent" },
  { value: "random", label: "Random" },
];

export default function OrderBy({ value, onChange }: Props) {
  const [position, setPosition] = React.useState(value ?? "relevance");

  React.useEffect(() => {
    if (typeof value === "string" && value !== position) setPosition(value);
  }, [value, position]);

  const handleChange = (v: string) => {
    setPosition(v);
    onChange?.(v);
  };

  const currentLabel =
    orderOptions.find((opt) => opt.value === position)?.label || "Sort";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-700 font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 flex items-center gap-2"
        >
          <ArrowUpDown className="h-4 w-4 text-blue-600" />
          <span className="hidden sm:inline">Sort by:</span>
          <span className="font-semibold text-blue-600">{currentLabel}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        className="w-48 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden"
        style={{ touchAction: "auto" }}
      >
        <DropdownMenuLabel className="text-gray-500 text-xs uppercase tracking-wide px-3 py-2 bg-gray-50 rounded-t-lg">
          Sort By
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-100" />
        <DropdownMenuRadioGroup value={position} onValueChange={handleChange}>
          {orderOptions.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 text-gray-700 transition-colors pl-9"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
