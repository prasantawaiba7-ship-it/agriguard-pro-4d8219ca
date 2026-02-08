import { Button } from '@/components/ui/button';
import { useCountry, type Country, getCountryLabel } from '@/hooks/useCountry';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';

export function CountrySelector() {
  const { country, setCountry } = useCountry();
  const { language } = useLanguage();
  const isNepali = language === 'ne';

  const countries: { value: Country; flag: string }[] = [
    { value: 'nepal', flag: '🇳🇵' },
    { value: 'india', flag: '🇮🇳' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <div className="flex rounded-lg border bg-muted p-1">
        {countries.map(({ value, flag }) => (
          <Button
            key={value}
            variant={country === value ? 'default' : 'ghost'}
            size="sm"
            className="gap-1.5 px-3"
            onClick={() => setCountry(value)}
          >
            <span>{flag}</span>
            <span className="hidden sm:inline">
              {getCountryLabel(value, isNepali)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
