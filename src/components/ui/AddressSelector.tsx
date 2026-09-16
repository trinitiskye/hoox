'use client';

import { useState, useEffect } from 'react';
import { COUNTRIES, getStatesForCountry, getCitiesForState } from '@/lib/addressData';

export interface AddressValue {
  address: string;
  country: string;
  state: string;
  city: string;
  zip: string;
}

interface AddressSelectorProps {
  value: AddressValue;
  onChange: (val: AddressValue) => void;
  inputClass?: string;
  labelClass?: string;
  required?: boolean;
}

const DEFAULT_INPUT = 'w-full px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition';
const DEFAULT_LABEL = 'block text-sm font-medium text-gray-700 mb-1.5';

export default function AddressSelector({
  value,
  onChange,
  inputClass = DEFAULT_INPUT,
  labelClass = DEFAULT_LABEL,
  required = false,
}: AddressSelectorProps) {
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const reqMark = required ? ' *' : '';

  // When country changes, reload states and clear state/city
  useEffect(() => {
    if (value.country) {
      const s = getStatesForCountry(value.country);
      setStates(s);
      // Only clear if the current state isn't valid for the new country
      const valid = s.some(st => st.code === value.state);
      if (!valid) {
        onChange({ ...value, state: '', city: '' });
        setCities([]);
      }
    } else {
      setStates([]);
      setCities([]);
    }
  }, [value.country]);

  // When state changes, reload cities and clear city
  useEffect(() => {
    if (value.country && value.state) {
      const c = getCitiesForState(value.country, value.state);
      setCities(c);
      const valid = c.includes(value.city);
      if (!valid) {
        onChange({ ...value, city: '' });
      }
    } else {
      setCities([]);
    }
  }, [value.state, value.country]);

  const set = (key: keyof AddressValue) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onChange({ ...value, [key]: e.target.value });

  const countryData = COUNTRIES.find(c => c.code === value.country);
  const stateLabel = countryData?.stateLabel || 'State / Province';
  const cityLabel = countryData?.cityLabel || 'City';

  return (
    <div className="space-y-4">
      {/* Street Address */}
      <div>
        <label className={labelClass}>Street Address{reqMark}</label>
        <input
          type="text"
          value={value.address}
          onChange={set('address')}
          placeholder="123 Main Street"
          className={inputClass}
        />
      </div>

      {/* Country */}
      <div>
        <label className={labelClass}>Country{reqMark}</label>
        <select
          value={value.country}
          onChange={set('country')}
          className={inputClass}
        >
          <option value="">Select a country...</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* State / Province — only show when country selected */}
      {value.country && (
        <div>
          <label className={labelClass}>{stateLabel}{reqMark}</label>
          {states.length > 0 ? (
            <select
              value={value.state}
              onChange={set('state')}
              className={inputClass}
            >
              <option value="">Select {stateLabel.toLowerCase()}...</option>
              {states.map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value.state}
              onChange={set('state')}
              placeholder={`Enter ${stateLabel.toLowerCase()}`}
              className={inputClass}
            />
          )}
        </div>
      )}

      {/* City — dropdown if cities available, text input otherwise */}
      {value.country && (
        <div>
          <label className={labelClass}>{cityLabel}{reqMark}</label>
          {cities.length > 0 ? (
            <select
              value={value.city}
              onChange={set('city')}
              className={inputClass}
              disabled={!value.state}
            >
              <option value="">
                {value.state ? `Select ${cityLabel.toLowerCase()}...` : `Select ${stateLabel.toLowerCase()} first`}
              </option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value.city}
              onChange={set('city')}
              placeholder={`Enter ${cityLabel.toLowerCase()}`}
              className={inputClass}
              disabled={!!value.state && states.length > 0 && !value.state}
            />
          )}
        </div>
      )}

      {/* Zip / Postal Code */}
      <div>
        <label className={labelClass}>
          {value.country === 'CA' ? 'Postal Code' :
           value.country === 'GB' ? 'Postcode' :
           value.country === 'AU' ? 'Postcode' :
           'Zip / Postal Code'}{reqMark}
        </label>
        <input
          type="text"
          value={value.zip}
          onChange={set('zip')}
          placeholder={
            value.country === 'US' ? '85001' :
            value.country === 'CA' ? 'A1A 1A1' :
            value.country === 'AU' ? '2000' :
            value.country === 'GB' ? 'SW1A 1AA' :
            'Postal code'
          }
          className={inputClass}
        />
      </div>
    </div>
  );
}
