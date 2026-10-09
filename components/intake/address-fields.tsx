import { SelectField, TextField } from "@/components/ui/field";
import { COUNTRIES } from "@/lib/domain/directory";
import { US_STATES } from "@/lib/domain/profile";

export interface AddressValue {
  country: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export type AddressErrors = Partial<Record<keyof AddressValue, string>>;

interface Props {
  value: AddressValue;
  errors: AddressErrors;
  onChange: (patch: Partial<AddressValue>) => void;
  placeholders: { address: string; city: string; zip: string };
}

/** Country / street / city / state / ZIP block shared by the claimant and defendant steps. */
export function AddressFields({ value, errors, onChange, placeholders }: Props) {
  const us = (value.country || "US").toUpperCase() === "US";
  return (
    <div className="space-y-4">
      <SelectField
        label="Country"
        value={value.country || "US"}
        options={COUNTRIES}
        error={errors.country}
        onChange={(e) => onChange({ country: e.target.value, state: "" })}
      />
      <TextField
        label="Street address"
        value={value.address}
        placeholder={placeholders.address}
        error={errors.address}
        autoComplete="address-line1"
        onChange={(e) => onChange({ address: e.target.value })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextField
          label="City"
          value={value.city}
          placeholder={placeholders.city}
          error={errors.city}
          autoComplete="address-level2"
          onChange={(e) => onChange({ city: e.target.value })}
        />
        {us ? (
          <SelectField
            label="State"
            value={value.state}
            error={errors.state}
            options={[{ value: "", label: "Select state" }, ...US_STATES.map((s) => ({ value: s, label: s }))]}
            onChange={(e) => onChange({ state: e.target.value })}
          />
        ) : (
          <TextField
            label="State / Province"
            value={value.state}
            placeholder="Province / Region"
            error={errors.state}
            onChange={(e) => onChange({ state: e.target.value })}
          />
        )}
        <TextField
          label={us ? "ZIP code" : "Postal code"}
          value={value.zip}
          placeholder={us ? placeholders.zip : "M4W 3M5"}
          error={errors.zip}
          maxLength={us ? 10 : undefined}
          inputMode={us ? "numeric" : undefined}
          autoComplete="postal-code"
          onChange={(e) => onChange({ zip: us ? e.target.value.replace(/[^\d-]/g, "") : e.target.value })}
        />
      </div>
    </div>
  );
}
