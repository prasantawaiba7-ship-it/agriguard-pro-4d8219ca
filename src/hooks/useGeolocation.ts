import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  isLoading: boolean;
  error: string | null;
}

interface UseGeolocationOptions {
  autoFetch?: boolean;
  enableHighAccuracy?: boolean;
  timeout?: number;
}

// Nepal districts mapping for reverse geocoding fallback
const NEPAL_DISTRICTS: Record<string, { lat: [number, number]; lng: [number, number]; name: string; nameNe: string }> = {
  kathmandu: { lat: [27.6, 27.8], lng: [85.2, 85.5], name: 'Kathmandu', nameNe: 'काठमाडौं' },
  lalitpur: { lat: [27.5, 27.7], lng: [85.25, 85.45], name: 'Lalitpur', nameNe: 'ललितपुर' },
  bhaktapur: { lat: [27.65, 27.75], lng: [85.4, 85.5], name: 'Bhaktapur', nameNe: 'भक्तपुर' },
  chitwan: { lat: [27.3, 27.8], lng: [83.9, 84.8], name: 'Chitwan', nameNe: 'चितवन' },
  kaski: { lat: [28.1, 28.5], lng: [83.8, 84.2], name: 'Kaski', nameNe: 'कास्की' },
  morang: { lat: [26.4, 26.9], lng: [87.2, 87.7], name: 'Morang', nameNe: 'मोरङ' },
  sunsari: { lat: [26.5, 26.9], lng: [86.9, 87.3], name: 'Sunsari', nameNe: 'सुनसरी' },
  jhapa: { lat: [26.4, 26.8], lng: [87.7, 88.2], name: 'Jhapa', nameNe: 'झापा' },
  rupandehi: { lat: [27.4, 27.8], lng: [83.2, 83.7], name: 'Rupandehi', nameNe: 'रुपन्देही' },
  banke: { lat: [27.9, 28.4], lng: [81.4, 82.1], name: 'Banke', nameNe: 'बाँके' },
  kailali: { lat: [28.5, 29.1], lng: [80.4, 81.2], name: 'Kailali', nameNe: 'कैलाली' },
  makwanpur: { lat: [27.3, 27.7], lng: [84.8, 85.3], name: 'Makwanpur', nameNe: 'मकवानपुर' },
  parsa: { lat: [27.0, 27.4], lng: [84.6, 85.1], name: 'Parsa', nameNe: 'पर्सा' },
  bara: { lat: [26.9, 27.3], lng: [84.9, 85.4], name: 'Bara', nameNe: 'बारा' },
  dang: { lat: [27.8, 28.4], lng: [82.2, 82.9], name: 'Dang', nameNe: 'दाङ' },
  surkhet: { lat: [28.4, 28.9], lng: [81.4, 82.0], name: 'Surkhet', nameNe: 'सुर्खेत' },
  dhading: { lat: [27.7, 28.2], lng: [84.6, 85.2], name: 'Dhading', nameNe: 'धादिङ' },
  nuwakot: { lat: [27.8, 28.2], lng: [85.0, 85.4], name: 'Nuwakot', nameNe: 'नुवाकोट' },
  sindhupalchok: { lat: [27.7, 28.2], lng: [85.5, 86.2], name: 'Sindhupalchok', nameNe: 'सिन्धुपाल्चोक' },
  kavrepalanchok: { lat: [27.4, 27.8], lng: [85.4, 85.9], name: 'Kavrepalanchok', nameNe: 'काभ्रेपलाञ्चोक' },
  dolakha: { lat: [27.6, 28.1], lng: [86.0, 86.5], name: 'Dolakha', nameNe: 'दोलखा' },
  ramechhap: { lat: [27.3, 27.7], lng: [85.8, 86.4], name: 'Ramechhap', nameNe: 'रामेछाप' },
  sindhuli: { lat: [27.0, 27.5], lng: [85.7, 86.3], name: 'Sindhuli', nameNe: 'सिन्धुली' },
  sarlahi: { lat: [26.8, 27.2], lng: [85.4, 86.0], name: 'Sarlahi', nameNe: 'सर्लाही' },
  mahottari: { lat: [26.7, 27.1], lng: [85.7, 86.2], name: 'Mahottari', nameNe: 'महोत्तरी' },
  dhanusha: { lat: [26.7, 27.1], lng: [85.8, 86.3], name: 'Dhanusha', nameNe: 'धनुषा' },
  siraha: { lat: [26.5, 26.9], lng: [86.1, 86.6], name: 'Siraha', nameNe: 'सिराहा' },
  saptari: { lat: [26.5, 26.9], lng: [86.5, 87.1], name: 'Saptari', nameNe: 'सप्तरी' },
  udayapur: { lat: [26.8, 27.3], lng: [86.4, 87.0], name: 'Udayapur', nameNe: 'उदयपुर' },
  khotang: { lat: [27.0, 27.4], lng: [86.7, 87.2], name: 'Khotang', nameNe: 'खोटाङ' },
  okhaldhunga: { lat: [27.2, 27.6], lng: [86.4, 86.8], name: 'Okhaldhunga', nameNe: 'ओखलढुङ्गा' },
  solukhumbu: { lat: [27.4, 28.0], lng: [86.5, 87.1], name: 'Solukhumbu', nameNe: 'सोलुखुम्बु' },
  sankhuwasabha: { lat: [27.3, 27.9], lng: [87.1, 87.6], name: 'Sankhuwasabha', nameNe: 'सङ्खुवासभा' },
  bhojpur: { lat: [27.0, 27.4], lng: [86.9, 87.4], name: 'Bhojpur', nameNe: 'भोजपुर' },
  dhankuta: { lat: [26.9, 27.3], lng: [87.2, 87.5], name: 'Dhankuta', nameNe: 'धनकुटा' },
  terhathum: { lat: [27.0, 27.4], lng: [87.4, 87.7], name: 'Terhathum', nameNe: 'तेह्रथुम' },
  panchthar: { lat: [27.0, 27.4], lng: [87.7, 88.1], name: 'Panchthar', nameNe: 'पाँचथर' },
  ilam: { lat: [26.8, 27.2], lng: [87.8, 88.2], name: 'Ilam', nameNe: 'इलाम' },
  taplejung: { lat: [27.2, 27.8], lng: [87.6, 88.1], name: 'Taplejung', nameNe: 'ताप्लेजुङ' },
  nawalparasi_east: { lat: [27.4, 27.8], lng: [83.9, 84.4], name: 'Nawalparasi East', nameNe: 'नवलपरासी (पूर्व)' },
  nawalparasi_west: { lat: [27.4, 27.8], lng: [83.5, 84.0], name: 'Nawalparasi West', nameNe: 'नवलपरासी (पश्चिम)' },
  palpa: { lat: [27.7, 28.1], lng: [83.3, 83.8], name: 'Palpa', nameNe: 'पाल्पा' },
  syangja: { lat: [28.0, 28.4], lng: [83.6, 84.1], name: 'Syangja', nameNe: 'स्याङ्जा' },
  tanahu: { lat: [27.9, 28.3], lng: [84.0, 84.5], name: 'Tanahu', nameNe: 'तनहुँ' },
  gorkha: { lat: [27.9, 28.5], lng: [84.3, 85.0], name: 'Gorkha', nameNe: 'गोरखा' },
  lamjung: { lat: [28.1, 28.5], lng: [84.2, 84.6], name: 'Lamjung', nameNe: 'लमजुङ' },
  manang: { lat: [28.5, 29.0], lng: [83.9, 84.5], name: 'Manang', nameNe: 'मनाङ' },
  mustang: { lat: [28.7, 29.4], lng: [83.5, 84.2], name: 'Mustang', nameNe: 'मुस्ताङ' },
  myagdi: { lat: [28.3, 28.8], lng: [83.3, 83.8], name: 'Myagdi', nameNe: 'म्याग्दी' },
  baglung: { lat: [28.2, 28.6], lng: [83.2, 83.7], name: 'Baglung', nameNe: 'बाग्लुङ' },
  parbat: { lat: [28.2, 28.5], lng: [83.5, 83.9], name: 'Parbat', nameNe: 'पर्वत' },
  gulmi: { lat: [27.9, 28.3], lng: [83.0, 83.5], name: 'Gulmi', nameNe: 'गुल्मी' },
  arghakhanchi: { lat: [27.8, 28.2], lng: [82.9, 83.4], name: 'Arghakhanchi', nameNe: 'अर्घाखाँची' },
  kapilvastu: { lat: [27.4, 27.8], lng: [82.7, 83.3], name: 'Kapilvastu', nameNe: 'कपिलवस्तु' },
  pyuthan: { lat: [27.9, 28.3], lng: [82.6, 83.1], name: 'Pyuthan', nameNe: 'प्युठान' },
  rolpa: { lat: [28.2, 28.7], lng: [82.4, 83.0], name: 'Rolpa', nameNe: 'रोल्पा' },
  rukum_east: { lat: [28.5, 29.0], lng: [82.4, 82.9], name: 'Rukum East', nameNe: 'रुकुम (पूर्व)' },
  salyan: { lat: [28.3, 28.8], lng: [82.0, 82.6], name: 'Salyan', nameNe: 'सल्यान' },
  bardiya: { lat: [28.2, 28.7], lng: [81.2, 81.8], name: 'Bardiya', nameNe: 'बर्दिया' },
  dailekh: { lat: [28.7, 29.2], lng: [81.5, 82.1], name: 'Dailekh', nameNe: 'दैलेख' },
  jajarkot: { lat: [28.7, 29.2], lng: [81.9, 82.5], name: 'Jajarkot', nameNe: 'जाजरकोट' },
  dolpa: { lat: [28.9, 29.5], lng: [82.6, 83.3], name: 'Dolpa', nameNe: 'डोल्पा' },
  jumla: { lat: [29.1, 29.5], lng: [82.0, 82.6], name: 'Jumla', nameNe: 'जुम्ला' },
  kalikot: { lat: [29.0, 29.5], lng: [81.5, 82.1], name: 'Kalikot', nameNe: 'कालिकोट' },
  mugu: { lat: [29.3, 29.8], lng: [81.8, 82.4], name: 'Mugu', nameNe: 'मुगु' },
  humla: { lat: [29.6, 30.2], lng: [81.5, 82.2], name: 'Humla', nameNe: 'हुम्ला' },
  bajura: { lat: [29.3, 29.8], lng: [81.1, 81.6], name: 'Bajura', nameNe: 'बाजुरा' },
  bajhang: { lat: [29.4, 29.9], lng: [80.8, 81.4], name: 'Bajhang', nameNe: 'बझाङ' },
  achham: { lat: [28.9, 29.4], lng: [81.0, 81.6], name: 'Achham', nameNe: 'अछाम' },
  doti: { lat: [29.0, 29.5], lng: [80.5, 81.1], name: 'Doti', nameNe: 'डोटी' },
  kanchanpur: { lat: [28.8, 29.3], lng: [80.0, 80.6], name: 'Kanchanpur', nameNe: 'कञ्चनपुर' },
  dadeldhura: { lat: [29.0, 29.5], lng: [80.3, 80.8], name: 'Dadeldhura', nameNe: 'डडेल्धुरा' },
  baitadi: { lat: [29.3, 29.8], lng: [80.2, 80.7], name: 'Baitadi', nameNe: 'बैतडी' },
  darchula: { lat: [29.6, 30.2], lng: [80.3, 81.0], name: 'Darchula', nameNe: 'दार्चुला' },
};

// Find district based on coordinates
function findDistrictByCoords(lat: number, lng: number): { name: string; nameNe: string } | null {
  for (const [, district] of Object.entries(NEPAL_DISTRICTS)) {
    if (
      lat >= district.lat[0] && lat <= district.lat[1] &&
      lng >= district.lng[0] && lng <= district.lng[1]
    ) {
      return { name: district.name, nameNe: district.nameNe };
    }
  }
  return null;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { autoFetch = false, enableHighAccuracy = true, timeout = 10000 } = options;
  
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    locationName: null,
    isLoading: false,
    error: null,
  });

  const fetchLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'तपाईंको ब्राउजरले स्थान सेवा समर्थन गर्दैन',
        isLoading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy,
          timeout,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Try to find district from coordinates
      const district = findDistrictByCoords(latitude, longitude);
      
      let locationName = district?.nameNe || null;
      
      // If no district found, try reverse geocoding API
      if (!locationName) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ne`
          );
          const data = await response.json();
          
          locationName = data.address?.county || 
                        data.address?.state_district || 
                        data.address?.city ||
                        data.address?.town ||
                        data.address?.village ||
                        'नेपाल';
        } catch {
          // Fallback to coordinates if API fails
          locationName = district?.nameNe || 'नेपाल';
        }
      }

      setState({
        latitude,
        longitude,
        locationName,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      let errorMessage = 'स्थान पत्ता लगाउन असफल';
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'स्थान पहुँचको अनुमति दिइएको छैन';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'स्थान जानकारी उपलब्ध छैन';
            break;
          case error.TIMEOUT:
            errorMessage = 'स्थान खोज्न समय सकियो';
            break;
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [enableHighAccuracy, timeout]);

  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch, fetchLocation]);

  return {
    ...state,
    fetchLocation,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  };
}
