export type SchoolListing = { name: string; city: string };

export type SchoolSelection = { state: string; name: string; city: string };

export type NewSchoolPayload = {
  schoolName: string;
  schoolWebsite: string;
  schoolCity: string;
  schoolState: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  contactTitle: string;
};

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

/** Curated schools by state (alphabetical within each state at render time). */
const SCHOOLS: Partial<Record<string, SchoolListing[]>> = {
  TX: [
    { name: "Austin Christian High School", city: "Austin" },
    { name: "Grace Academy of Dallas", city: "Dallas" },
    { name: "Houston Christian High School", city: "Houston" },
    { name: "The Woodlands Christian Academy", city: "The Woodlands" },
    { name: "Fort Worth Country Day School", city: "Fort Worth" },
    { name: "St. Andrew's Episcopal School", city: "Austin" },
    { name: "Greenhill School", city: "Addison" },
    { name: "Trinity Christian Academy", city: "Addison" },
  ],
  CA: [
    { name: "Bishop O'Dowd High School", city: "Oakland" },
    { name: "Harvard-Westlake School", city: "Los Angeles" },
    { name: "Menlo School", city: "Atherton" },
    { name: "Notre Dame High School", city: "Sherman Oaks" },
    { name: "Pacific Bay Christian School", city: "Pacifica" },
    { name: "Sacred Heart Cathedral Preparatory", city: "San Francisco" },
    { name: "The Bishop's School", city: "La Jolla" },
  ],
  FL: [
    { name: "Belen Jesuit Preparatory School", city: "Miami" },
    { name: "Christ School", city: "Orlando" },
    { name: "Montverde Academy", city: "Montverde" },
    { name: "Pine Crest School", city: "Fort Lauderdale" },
    { name: "Saint Andrew's School", city: "Boca Raton" },
    { name: "Trinity Preparatory School", city: "Winter Park" },
  ],
  NY: [
    { name: "Collegiate School", city: "New York" },
    { name: "Horace Mann School", city: "Bronx" },
    { name: "Regis High School", city: "New York" },
    { name: "The Dalton School", city: "New York" },
    { name: "Trinity School", city: "New York" },
  ],
  PA: [
    { name: "Germantown Friends School", city: "Philadelphia" },
    { name: "The Haverford School", city: "Haverford" },
    { name: "William Penn Charter School", city: "Philadelphia" },
  ],
  OH: [
    { name: "Hawken School", city: "Gates Mills" },
    { name: "Laurel School", city: "Shaker Heights" },
    { name: "University School", city: "Hunting Valley" },
  ],
  GA: [
    { name: "Atlanta International School", city: "Atlanta" },
    { name: "The Lovett School", city: "Atlanta" },
    { name: "Westminster Schools", city: "Atlanta" },
  ],
  VA: [
    { name: "Bishop O'Connell High School", city: "Arlington" },
    { name: "The Potomac School", city: "McLean" },
    { name: "St. Christopher's School", city: "Richmond" },
  ],
  WA: [
    { name: "Eastside Preparatory School", city: "Kirkland" },
    { name: "Lakeside School", city: "Seattle" },
    { name: "Overlake School", city: "Redmond" },
  ],
  IL: [
    { name: "Francis W. Parker School", city: "Chicago" },
    { name: "Latin School of Chicago", city: "Chicago" },
    { name: "Walter Payton College Prep", city: "Chicago" },
  ],
  NC: [
    { name: "Cary Academy", city: "Cary" },
    { name: "Durham Academy", city: "Durham" },
    { name: "Charlotte Latin School", city: "Charlotte" },
  ],
  CO: [
    { name: "Colorado Academy", city: "Denver" },
    { name: "Kent Denver School", city: "Englewood" },
  ],
  AZ: [
    { name: "Brophy College Preparatory", city: "Phoenix" },
    { name: "Phoenix Country Day School", city: "Paradise Valley" },
  ],
  TN: [
    { name: "Montgomery Bell Academy", city: "Nashville" },
    { name: "University School of Nashville", city: "Nashville" },
  ],
  MA: [
    { name: "Boston University Academy", city: "Boston" },
    { name: "Phillips Academy Andover", city: "Andover" },
  ],
  NJ: [
    { name: "Delbarton School", city: "Morristown" },
    { name: "The Lawrenceville School", city: "Lawrenceville" },
  ],
  MI: [
    { name: "Cranbrook Schools", city: "Bloomfield Hills" },
    { name: "Greenhills School", city: "Ann Arbor" },
  ],
  MO: [
    { name: "John Burroughs School", city: "St. Louis" },
    { name: "MICDS", city: "St. Louis" },
  ],
  OR: [
    { name: "Catlin Gabel School", city: "Portland" },
    { name: "Jesuit High School", city: "Portland" },
  ],
  MN: [
    { name: "Blake School", city: "Hopkins" },
    { name: "Minnetonka High School", city: "Minnetonka" },
  ],
};

export function schoolToKey(s: SchoolSelection): string {
  return JSON.stringify(s);
}

export function keyToSchool(k: string): SchoolSelection | null {
  try {
    const o = JSON.parse(k) as SchoolSelection;
    if (o?.state && o?.name && o?.city) return o;
    return null;
  } catch {
    return null;
  }
}

export function formatSchoolLabel(s: SchoolSelection): string {
  return `${s.name} (${s.city}, ${s.state})`;
}

export function getSchoolsForState(
  abbr: string,
  extra: Record<string, SchoolListing[]>
): SchoolListing[] {
  const base = SCHOOLS[abbr] ?? [];
  const added = extra[abbr] ?? [];
  const merged = [...base];
  for (const row of added) {
    if (
      !merged.some(
        (m) =>
          m.name.toLowerCase() === row.name.toLowerCase() &&
          m.city.toLowerCase() === row.city.toLowerCase()
      )
    ) {
      merged.push(row);
    }
  }
  return merged.sort((a, b) => a.name.localeCompare(b.name));
}
