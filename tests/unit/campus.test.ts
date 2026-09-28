import {
  getCampusByDomain,
  getCampusByEmail,
  isAllowedCampusEmail,
  DEFAULT_CAMPUSES,
} from '../../src/constants/campuses';
import {
  getCampusByDomain as getBackendCampusByDomain,
  getCampusByEmail as getBackendCampusByEmail,
} from '../../functions/src/utils/campus';

describe('Campus Domain Resolution & Allowlist', () => {
  describe('Client Campus Helpers', () => {
    it('correctly maps university domain to campus metadata', () => {
      const uncc = getCampusByDomain('charlotte.edu');
      expect(uncc).not.toBeNull();
      expect(uncc?.campusId).toBe('uncc');
      expect(uncc?.shortName).toBe('UNC Charlotte');

      const ncsu = getCampusByDomain('ncsu.edu');
      expect(ncsu?.campusId).toBe('ncsu');

      const unc = getCampusByDomain('unc.edu');
      expect(unc?.campusId).toBe('unc');

      const vt = getCampusByDomain('vt.edu');
      expect(vt?.campusId).toBe('vt');
    });

    it('handles student subdomains correctly', () => {
      const studentUncc = getCampusByDomain('student.charlotte.edu');
      expect(studentUncc?.campusId).toBe('uncc');

      const alumniNcsu = getCampusByDomain('alumni.ncsu.edu');
      expect(alumniNcsu?.campusId).toBe('ncsu');
    });

    it('extracts campus from full email addresses', () => {
      const student = getCampusByEmail('student@charlotte.edu');
      expect(student?.campusId).toBe('uncc');

      const wolfpack = getCampusByEmail('researcher@ncsu.edu');
      expect(wolfpack?.campusId).toBe('ncsu');

      const testUser = getCampusByEmail('tester@test.edu');
      expect(testUser?.campusId).toBe('test-campus');
    });

    it('rejects public consumer email providers', () => {
      expect(isAllowedCampusEmail('user@gmail.com')).toBe(false);
      expect(isAllowedCampusEmail('user@yahoo.com')).toBe(false);
      expect(isAllowedCampusEmail('user@outlook.com')).toBe(false);
      expect(isAllowedCampusEmail('user@icloud.com')).toBe(false);
      expect(isAllowedCampusEmail('attacker@random-domain.org')).toBe(false);
    });

    it('is case-insensitive and trims whitespace', () => {
      expect(isAllowedCampusEmail('  STUDENT@CHARLOTTE.EDU  ')).toBe(true);
      const campus = getCampusByEmail('  RESEARCH@NCSU.EDU  ');
      expect(campus?.campusId).toBe('ncsu');
    });
  });

  describe('Backend Cloud Functions Campus Utility', () => {
    it('mirrors domain resolution identically on the server', () => {
      expect(getBackendCampusByDomain('charlotte.edu')?.campusId).toBe('uncc');
      expect(getBackendCampusByDomain('ncsu.edu')?.campusId).toBe('ncsu');
      expect(getBackendCampusByDomain('vt.edu')?.campusId).toBe('vt');
      expect(getBackendCampusByEmail('student@charlotte.edu')?.campusId).toBe('uncc');
      expect(getBackendCampusByEmail('user@gmail.com')).toBeNull();
    });
  });
});
