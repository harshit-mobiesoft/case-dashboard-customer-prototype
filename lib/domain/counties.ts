// Stand-in for the production county lookup (ZIP → county, text search).

export interface County {
  id: string;
  name: string;
  state: string;
  /** 3-digit ZIP prefixes served by this county (prototype approximation). */
  zipPrefixes: string[];
}

export const COUNTIES: County[] = [
  { id: "sacramento-ca", name: "Sacramento County", state: "CA", zipPrefixes: ["956", "957", "958"] },
  { id: "los-angeles-ca", name: "Los Angeles County", state: "CA", zipPrefixes: ["900", "901", "902", "903", "904", "905", "906", "907", "908", "910", "911", "912", "913", "914", "915", "916", "917", "918"] },
  { id: "san-diego-ca", name: "San Diego County", state: "CA", zipPrefixes: ["919", "920", "921"] },
  { id: "alameda-ca", name: "Alameda County", state: "CA", zipPrefixes: ["945", "946", "947"] },
  { id: "san-francisco-ca", name: "San Francisco County", state: "CA", zipPrefixes: ["941"] },
  { id: "santa-clara-ca", name: "Santa Clara County", state: "CA", zipPrefixes: ["950", "951"] },
  { id: "orange-ca", name: "Orange County", state: "CA", zipPrefixes: ["926", "927", "928"] },
  { id: "riverside-ca", name: "Riverside County", state: "CA", zipPrefixes: ["925"] },
  { id: "san-bernardino-ca", name: "San Bernardino County", state: "CA", zipPrefixes: ["923", "924"] },
  { id: "fresno-ca", name: "Fresno County", state: "CA", zipPrefixes: ["936", "937"] },
  { id: "kern-ca", name: "Kern County", state: "CA", zipPrefixes: ["933"] },
  { id: "ventura-ca", name: "Ventura County", state: "CA", zipPrefixes: ["930"] },
  { id: "new-york-ny", name: "New York County", state: "NY", zipPrefixes: ["100", "101", "102"] },
  { id: "cook-il", name: "Cook County", state: "IL", zipPrefixes: ["606"] },
  { id: "harris-tx", name: "Harris County", state: "TX", zipPrefixes: ["770", "771", "772"] },
  { id: "dallas-tx", name: "Dallas County", state: "TX", zipPrefixes: ["752"] },
  { id: "travis-tx", name: "Travis County", state: "TX", zipPrefixes: ["787"] },
  { id: "maricopa-az", name: "Maricopa County", state: "AZ", zipPrefixes: ["850", "851", "852", "853"] },
  { id: "king-wa", name: "King County", state: "WA", zipPrefixes: ["981"] },
  { id: "clark-nv", name: "Clark County", state: "NV", zipPrefixes: ["889", "890", "891"] },
  { id: "miami-dade-fl", name: "Miami-Dade County", state: "FL", zipPrefixes: ["331"] },
  { id: "multnomah-or", name: "Multnomah County", state: "OR", zipPrefixes: ["972"] },
  { id: "denver-co", name: "Denver County", state: "CO", zipPrefixes: ["802"] },
  { id: "fulton-ga", name: "Fulton County", state: "GA", zipPrefixes: ["303"] },
];

export const countyLabel = (c: Pick<County, "name" | "state">) => `${c.name}, ${c.state}`;

export function countyById(id: string): County | undefined {
  return COUNTIES.find((c) => c.id === id);
}

export function countyForZip(zip: string): County | null {
  const prefix = zip.replace(/\D/g, "").slice(0, 3);
  if (prefix.length < 3) return null;
  return COUNTIES.find((c) => c.zipPrefixes.includes(prefix)) ?? null;
}

export function searchCounties(query: string, limit = 8): County[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  if (/^\d{3,5}$/.test(q)) {
    const c = countyForZip(q);
    return c ? [c] : [];
  }
  return COUNTIES.filter((c) => `${c.name} ${c.state}`.toLowerCase().includes(q)).slice(0, limit);
}

export interface CountySuggestions {
  claimant: County | null;
  defendant: County | null;
}

export function suggestCounties(claimantZip: string, defendantZip: string | null): CountySuggestions {
  return {
    claimant: countyForZip(claimantZip),
    defendant: defendantZip ? countyForZip(defendantZip) : null,
  };
}
