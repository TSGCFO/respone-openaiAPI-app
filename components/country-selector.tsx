"use client";

import React from "react";

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CountrySelector({ value, onChange }: CountrySelectorProps) {
  return (
    <select 
      className="bg-white border text-sm flex-1 text-zinc-900 px-3 py-2 rounded-md"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Select country</option>
      <option value="US">United States</option>
      <option value="GB">United Kingdom</option>
      <option value="CA">Canada</option>
      <option value="AU">Australia</option>
      <option value="FR">France</option>
      <option value="DE">Germany</option>
      <option value="JP">Japan</option>
      <option value="CN">China</option>
      <option value="IN">India</option>
      <option value="BR">Brazil</option>
    </select>
  );
}