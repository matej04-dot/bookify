"use client";

import * as React from "react";

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

export default function OrderBy({ value, onChange }: Props) {
  const [position, setPosition] = React.useState(value ?? "new");

  React.useEffect(() => {
    if (typeof value === "string" && value !== position) setPosition(value);
  }, [value]);

  const handleChange = (v: string) => {
    setPosition(v);
    onChange?.(v);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-gradient-to-r from-yellow-300 to-yellow-500 ml-3 mt-3 shadow-md border-gray-300 py-5 text-semibold"
        >
          Order By
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        className="w-56"
        style={{ touchAction: "auto" }}
      >
        <DropdownMenuLabel>Order By</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={position} onValueChange={handleChange}>
          <DropdownMenuRadioItem value="relevance">
            Relevance
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="trending">
            Trending
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="old">
            First Published
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="new">Most Recent</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="random">Random</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
