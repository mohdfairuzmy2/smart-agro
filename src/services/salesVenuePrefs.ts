const STORAGE_KEY = 'smart-agro-sales-venue-picks';

export function loadPickedVenueIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function savePickedVenueIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function togglePickedVenue(id: string, current: string[]): string[] {
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  savePickedVenueIds(next);
  return next;
}
