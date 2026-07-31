import { Input } from "@/components/ui/input";
import { COUNTRIES_SORTED } from "@/lib/countries";

export function PhoneInput({
  code,
  onCodeChange,
  value,
  onValueChange,
  id = "phone",
  required,
}: {
  code: string;
  onCodeChange: (v: string) => void;
  value: string;
  onValueChange: (v: string) => void;
  id?: string;
  required?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <select
        aria-label="Country code"
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        className="w-[7.5rem] rounded-xl border border-input bg-card px-2 py-2 text-sm"
      >
        {COUNTRIES_SORTED.map((c) => (
          <option key={c.iso} value={c.dial}>
            {c.flag} {c.iso} {c.dial}
          </option>
        ))}
      </select>
      <Input
        id={id}
        type="tel"
        required={required}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="7XX XXX XXX"
        className="flex-1"
      />
    </div>
  );
}
