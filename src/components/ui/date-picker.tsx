import * as React from "react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  selected?: Date | null
  onSelect?: (date: Date | null) => void
  className?: string
  placeholder?: string
}

export function DatePicker({
  selected,
  onSelect,
  className,
  placeholder = "اختر تاريخ",
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-between text-right font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          {selected ? (
            format(selected, "PPP", { locale: ar })
          ) : (
            <span>{placeholder}</span>
          )}
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected || undefined}
          onSelect={onSelect}
          locale={ar}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
