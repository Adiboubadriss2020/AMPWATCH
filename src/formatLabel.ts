/** Format API codes for UI: SOUS_CONSOMMATION → SOUS CONSOMMATION */
export function formatLabel(value?: string | null): string {
  if (value == null || value === '') return '—';
  return String(value).replace(/_/g, ' ');
}
