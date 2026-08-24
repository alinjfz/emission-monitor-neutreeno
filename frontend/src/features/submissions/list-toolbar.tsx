import {
  ArrowDown,
  ArrowUp,
  Columns3,
  Grid2X2,
  List,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type {
  SortDirection,
  SortName,
  StatusCounts,
  StatusFilter,
  ViewMode,
} from "@/types/api"

import {
  FIELD_LABELS,
  OPTIONAL_FIELDS,
  type FieldVisibility,
  type OptionalField,
} from "./use-field-visibility"

const statuses: StatusFilter[] = [
  "all",
  "new",
  "pending",
  "approved",
  "rejected",
]
const sortOptions: Array<{ value: SortName; label: string }> = [
  { value: "queue", label: "Review queue" },
  { value: "product", label: "Product" },
  { value: "supplier", label: "Supplier" },
  { value: "status", label: "Status" },
  { value: "footprint", label: "Footprint" },
  { value: "uncertainty", label: "Uncertainty" },
  { value: "period_end", label: "Period end" },
  { value: "duration", label: "Duration" },
  { value: "submitted_at", label: "Submitted" },
  { value: "last_modified_at", label: "Last modified" },
]

export function ListToolbar({
  search,
  status,
  counts,
  sort,
  direction,
  view,
  visibility,
  disabled,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onDirectionChange,
  onViewChange,
  onVisibilityChange,
}: {
  search: string
  status: StatusFilter
  counts?: StatusCounts
  sort: SortName
  direction: SortDirection
  view: ViewMode
  visibility: FieldVisibility
  disabled?: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (value: StatusFilter) => void
  onSortChange: (value: SortName) => void
  onDirectionChange: (value: SortDirection) => void
  onViewChange: (value: ViewMode) => void
  onVisibilityChange: (field: OptionalField, value: boolean) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            aria-label="Search product, SKU, or supplier"
            className="h-9 pl-9"
            maxLength={100}
            placeholder="Search product, SKU, or supplier"
            value={search}
            disabled={disabled}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={sort}
            onValueChange={(value) => onSortChange(value as SortName)}
            disabled={disabled}
          >
            <SelectTrigger
              className="h-9 w-[150px]"
              aria-label="Sort submissions"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            disabled={disabled || sort === "queue"}
            aria-label={`Sort ${direction === "asc" ? "descending" : "ascending"}`}
            onClick={() =>
              onDirectionChange(direction === "asc" ? "desc" : "asc")
            }
          >
            {direction === "asc" ? <ArrowUp /> : <ArrowDown />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg" disabled={disabled}>
                <Columns3 /> Display
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Visible fields</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {OPTIONAL_FIELDS.map((field) => (
                <DropdownMenuCheckboxItem
                  key={field}
                  checked={visibility[field]}
                  onCheckedChange={(checked) =>
                    onVisibilityChange(field, Boolean(checked))
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  {FIELD_LABELS[field]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={view}
            disabled={disabled}
            onValueChange={(value) => value && onViewChange(value as ViewMode)}
            aria-label="Choose list view"
          >
            <ToggleGroupItem value="table" aria-label="Table view">
              <List />
            </ToggleGroupItem>
            <ToggleGroupItem value="cards" aria-label="Card view">
              <Grid2X2 />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div
        className="flex flex-wrap gap-2 pb-1"
        role="group"
        aria-label="Filter by review status"
      >
        {statuses.map((item) => (
          <Button
            key={item}
            type="button"
            variant={status === item ? "default" : "outline"}
            size="sm"
            disabled={disabled}
            className="shrink-0 rounded-full capitalize"
            onClick={() => onStatusChange(item)}
          >
            {item}{" "}
            <span
              className={
                status === item ? "text-white/70" : "text-muted-foreground"
              }
            >
              {counts?.[item] ?? "—"}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
