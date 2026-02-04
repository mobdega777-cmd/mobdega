import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface DateFilterProps {
  onDateChange: (startDate: Date, endDate: Date) => void;
  defaultValue?: string;
}

const dateOptions = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7days", label: "7 dias" },
  { value: "15days", label: "15 dias" },
  { value: "30days", label: "30 dias" },
  { value: "thisMonth", label: "Esse mês" },
  { value: "custom", label: "Personalizar" },
];

/**
 * Retorna a data atual no fuso horário local (Brasil)
 * Evita problemas de UTC que causam datas erradas
 */
const getLocalToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
};

export const getDateRange = (option: string): { start: Date; end: Date } => {
  const today = getLocalToday();
  const endDate = endOfDay(today);

  switch (option) {
    case "today":
      return { start: startOfDay(today), end: endDate };
    case "yesterday":
      const yesterday = subDays(today, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case "7days":
      return { start: startOfDay(subDays(today, 6)), end: endDate };
    case "15days":
      return { start: startOfDay(subDays(today, 14)), end: endDate };
    case "30days":
      return { start: startOfDay(subDays(today, 29)), end: endDate };
    case "thisMonth":
      return { start: startOfDay(startOfMonth(today)), end: endDate };
    default:
      return { start: startOfDay(today), end: endDate };
  }
};

const DateFilter = ({ onDateChange, defaultValue = "today" }: DateFilterProps) => {
  const [selectedOption, setSelectedOption] = useState(defaultValue);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleOptionChange = useCallback((value: string) => {
    setSelectedOption(value);
    if (value === "custom") {
      setIsCalendarOpen(true);
    } else {
      const { start, end } = getDateRange(value);
      onDateChange(start, end);
    }
  }, [onDateChange]);

  const handleDateRangeSelect = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onDateChange(startOfDay(range.from), endOfDay(range.to));
      setIsCalendarOpen(false);
    }
  }, [onDateChange]);

  const handleClearSelection = useCallback(() => {
    setDateRange(undefined);
  }, []);

  const handleCancel = useCallback(() => {
    setSelectedOption("today");
    setIsCalendarOpen(false);
    const { start, end } = getDateRange("today");
    onDateChange(start, end);
  }, [onDateChange]);

  const displayValue = useMemo(() => {
    if (selectedOption === "custom" && dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`;
    }
    return dateOptions.find(o => o.value === selectedOption)?.label || "Hoje";
  }, [selectedOption, dateRange]);

  if (selectedOption === "custom" && isCalendarOpen) {
    return (
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-[140px]">
            <CalendarIcon className="w-4 h-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
            locale={ptBR}
          />
          <div className="p-3 border-t flex justify-end gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearSelection}
            >
              Limpar
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Select value={selectedOption} onValueChange={handleOptionChange}>
      <SelectTrigger className="w-[160px]">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          <span>{displayValue}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {dateOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DateFilter;
