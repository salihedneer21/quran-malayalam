export type PlaceSuggestion = {
  placeId: string;
  description: string;
};

type PlaceLookup = {
  latitude: number;
  longitude: number;
  name: string;
};

function extractPlaceName(result: any): string {
  const components = result?.address_components ?? [];
  const locality = components.find((c: any) => c.types?.includes('locality'));
  const adminArea = components.find((c: any) => c.types?.includes('administrative_area_level_1'));
  const country = components.find((c: any) => c.types?.includes('country'));

  const parts = [locality?.long_name, adminArea?.short_name, country?.short_name].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  return result?.formatted_address ?? 'Selected location';
}

export async function fetchPlaceSuggestions(input: string, apiKey: string | undefined): Promise<PlaceSuggestion[]> {
  const query = input.trim();
  if (!apiKey || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=geocode&key=${apiKey}`
    );
    const data = await response.json();

    if (data?.status !== 'OK' || !Array.isArray(data?.predictions)) return [];
    return data.predictions.slice(0, 6).map((p: any) => ({
      placeId: String(p.place_id),
      description: String(p.description),
    }));
  } catch {
    return [];
  }
}

export async function fetchPlaceDetails(placeId: string, apiKey: string | undefined): Promise<PlaceLookup | null> {
  if (!apiKey || !placeId) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        placeId
      )}&fields=geometry,formatted_address,address_components&key=${apiKey}`
    );
    const data = await response.json();
    const location = data?.result?.geometry?.location;
    if (data?.status !== 'OK' || typeof location?.lat !== 'number' || typeof location?.lng !== 'number') return null;

    return {
      latitude: location.lat,
      longitude: location.lng,
      name: extractPlaceName(data.result),
    };
  } catch {
    return null;
  }
}

export async function geocodeAddress(query: string, apiKey: string | undefined): Promise<PlaceLookup | null> {
  const q = query.trim();
  if (!apiKey || q.length < 2) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${apiKey}`
    );
    const data = await response.json();
    const first = data?.results?.[0];
    const location = first?.geometry?.location;
    if (data?.status !== 'OK' || typeof location?.lat !== 'number' || typeof location?.lng !== 'number') return null;

    return {
      latitude: location.lat,
      longitude: location.lng,
      name: extractPlaceName(first),
    };
  } catch {
    return null;
  }
}

export async function reverseGeocode(latitude: number, longitude: number, apiKey: string | undefined): Promise<string | null> {
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );
    const data = await response.json();
    const first = data?.results?.[0];
    if (data?.status !== 'OK' || !first) return null;

    return extractPlaceName(first);
  } catch {
    return null;
  }
}

