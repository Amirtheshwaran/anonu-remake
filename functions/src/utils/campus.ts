export interface CampusInfo {
  campusId: string;
  name: string;
  shortName: string;
  domains: string[];
}

export const CAMPUS_REGISTRY: Record<string, CampusInfo> = {
  uncc: {
    campusId: 'uncc',
    name: 'University of North Carolina at Charlotte',
    shortName: 'UNC Charlotte',
    domains: ['charlotte.edu'],
  },
  ncsu: {
    campusId: 'ncsu',
    name: 'North Carolina State University',
    shortName: 'NC State',
    domains: ['ncsu.edu'],
  },
  unc: {
    campusId: 'unc',
    name: 'University of North Carolina at Chapel Hill',
    shortName: 'UNC Chapel Hill',
    domains: ['unc.edu'],
  },
  duke: {
    campusId: 'duke',
    name: 'Duke University',
    shortName: 'Duke',
    domains: ['duke.edu'],
  },
  vt: {
    campusId: 'vt',
    name: 'Virginia Tech',
    shortName: 'Virginia Tech',
    domains: ['vt.edu'],
  },
  'test-campus': {
    campusId: 'test-campus',
    name: 'Test University',
    shortName: 'Test Campus',
    domains: ['test.edu', 'example.com'],
  },
};

export function getCampusByDomain(domain: string): CampusInfo | null {
  const cleanDomain = domain.toLowerCase().trim();
  for (const campus of Object.values(CAMPUS_REGISTRY)) {
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
