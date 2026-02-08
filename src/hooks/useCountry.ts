import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Country = 'nepal' | 'india';

interface CountryState {
  country: Country;
  setCountry: (country: Country) => void;
}

export const useCountry = create<CountryState>()(
  persist(
    (set) => ({
      country: 'nepal',
      setCountry: (country) => set({ country }),
    }),
    {
      name: 'kisan-sathi-country',
    }
  )
);

// Utility functions for country-specific formatting
export const getCurrencySymbol = (country: Country): string => {
  return country === 'nepal' ? 'रु.' : '₹';
};

export const formatPrice = (price: number, country: Country): string => {
  const symbol = getCurrencySymbol(country);
  return `${symbol} ${price.toLocaleString()}`;
};

export const getCountryLabel = (country: Country, inNative = false): string => {
  if (country === 'nepal') {
    return inNative ? 'नेपाल' : 'Nepal';
  }
  return inNative ? 'भारत' : 'India';
};
