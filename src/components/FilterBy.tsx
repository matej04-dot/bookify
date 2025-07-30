"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function FilterBy() {
  const handleFilterSelection = (filterName: string) => {
    console.log(`Filter odabran: ${filterName}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="mr-0.5 shadow-md border-gray-300 py-5 text-semibold"
        >
          Filter By
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-57">
        <DropdownMenuLabel>Filter By</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Author</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem
              onClick={() => handleFilterSelection("Mark Twain")}
            >
              Mark Twain
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleFilterSelection("Jane Austen")}
            >
              Jane Austen
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Genre</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem onClick={() => handleFilterSelection("Comics")}>
              Comics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilterSelection("Novel")}>
              Novel
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span>Rating</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem
              onClick={() => handleFilterSelection("1 and more")}
            >
              1 and more
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleFilterSelection("2 and more")}
            >
              2 and more
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
