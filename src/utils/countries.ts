import {CountryCode, getCountries, getCountryCallingCode} from 'libphonenumber-js';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

export type CountryItem = {
  code: CountryCode;
  name: string;
  callingCode: string;
  label: string;
};

countries.registerLocale(enLocale);

const NON_ISO_REGION_NAMES: Partial<Record<CountryCode, string>> = {
  AC: 'Ascension Island',
  TA: 'Tristan da Cunha',
  XK: 'Kosovo'
};

const getCountryName = (code: CountryCode) =>
  NON_ISO_REGION_NAMES[code] || countries.getName(code, 'en') || code;

export const getCountryFlagEmoji = (countryCode: CountryCode) =>
  countryCode.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));

export const COUNTRIES: CountryItem[] = getCountries()
  .map(code => {
    const name = getCountryName(code);
    const callingCode = getCountryCallingCode(code);

    return {
      code,
      name,
      callingCode,
      label: `${name} (+${callingCode})`
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export const getCountryByCode = (code: CountryCode) =>
  COUNTRIES.find(country => country.code === code);
