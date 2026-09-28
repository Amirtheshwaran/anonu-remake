export interface CampusInfo {
  campusId: string;
  name: string;
  shortName: string;
  domains: string[];
  state: string;
  primaryColor: string;
}

export const DEFAULT_CAMPUSES: Record<string, CampusInfo> = {
  uncc: {
    campusId: 'uncc',
    name: 'University of North Carolina at Charlotte',
    shortName: 'UNC Charlotte',
    domains: ['charlotte.edu'],
    state: 'NC',
    primaryColor: '#005035',
  },
  ncsu: {
    campusId: 'ncsu',
    name: 'North Carolina State University',
    shortName: 'NC State',
    domains: ['ncsu.edu'],
    state: 'NC',
    primaryColor: '#CC0000',
  },
  unc: {
    campusId: 'unc',
    name: 'University of North Carolina at Chapel Hill',
    shortName: 'UNC Chapel Hill',
    domains: ['unc.edu'],
    state: 'NC',
    primaryColor: '#4B9CD3',
  },
  duke: {
    campusId: 'duke',
    name: 'Duke University',
    shortName: 'Duke',
    domains: ['duke.edu'],
    state: 'NC',
    primaryColor: '#00539B',
  },
  vt: {
    campusId: 'vt',
    name: 'Virginia Tech',
    shortName: 'Virginia Tech',
    domains: ['vt.edu'],
    state: 'VA',
    primaryColor: '#861F41',
  },
  'test-campus': {
    campusId: 'test-campus',
    name: 'Test University',
    shortName: 'Test Campus',
    domains: ['test.edu', 'example.com'],
    state: 'NC',
    primaryColor: '#FFE600',
  },
};

export function getCampusByDomain(domain: string): CampusInfo | null {
  const cleanDomain = domain.toLowerCase().trim();
  for (const campus of Object.values(DEFAULT_CAMPUSES)) {
    if (campus.domains.some((d) => cleanDomain === d || cleanDomain.endsWith('.' + d))) {
      return campus;
    }
  }
  return null;
}

export function getCampusByEmail(email: string): CampusInfo | null {
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return null;
  return getCampusByDomain(parts[1]);
}

export function isAllowedCampusEmail(email: string): boolean {
  return getCampusByEmail(email) !== null;
}
