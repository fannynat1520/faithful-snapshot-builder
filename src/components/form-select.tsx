import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type FormSelectProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly (string | { value: string; label: string })[];
  disabled?: boolean;
  placeholder?: string;
};

export function FormSelect({
  label, value, onValueChange, options, disabled = false, placeholder = "Selecciona",
}: FormSelectProps) {
  return (
    <Select required value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}