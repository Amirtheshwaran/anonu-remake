import { screenContent } from '../../functions/src/utils/moderation';

describe('Automated Content Screening & Moderation', () => {
  describe('PII Detection', () => {
    it('detects phone numbers in various standard formats', () => {
      expect(screenContent('Call me at 704-555-0199 for notes').hasPII).toBe(true);
      expect(screenContent('Text (704) 555-0199 if found').hasPII).toBe(true);
      expect(screenContent('+1 704 555 0199 is my number').hasPII).toBe(true);
      expect(screenContent('7045550199').hasPII).toBe(true);
    });

    it('detects email addresses', () => {
      const res = screenContent('Email me at student@charlotte.edu for the pdf');
      expect(res.hasPII).toBe(true);
      expect(res.piiType).toBe('email');
      expect(res.action).toBe('auto_hide');
    });

    it('detects student identification numbers', () => {
      const res = screenContent('My student ID is 800987654 can someone check?');
      expect(res.hasPII).toBe(true);
      expect(res.piiType).toBe('student_id');
      expect(res.action).toBe('auto_hide');
    });

    it('detects physical campus and street addresses', () => {
      const res = screenContent('Meet me at 9201 University City Blvd outside');
      expect(res.hasPII).toBe(true);
      expect(res.piiType).toBe('address');
      expect(res.action).toBe('auto_hide');
    });
  });

  describe('Crisis & Self-Harm Detection', () => {
    it('flags self-harm signals without deleting so supportive care can trigger', () => {
      const res = screenContent('I really feel like I want to die tonight, finals are too much');
      expect(res.isCrisis).toBe(true);
      expect(res.severity).toBe('crisis');
      expect(res.toxicityScores.selfHarm).toBeGreaterThanOrEqual(0.8);
      // Ensures action is queued for moderator awareness, not silently destroyed
      expect(res.action).toBe('queue');
    });

    it('flags explicit suicide threats', () => {
      const res = screenContent('thinking about how to kill myself after this week');
      expect(res.isCrisis).toBe(true);
      expect(res.severity).toBe('crisis');
    });
  });

  describe('Toxicity & Policy Violations', () => {
    it('auto-hides violent threats', () => {
      const res = screenContent('I am going to kill whoever took my bike');
      expect(res.action).toBe('auto_hide');
      expect(res.severity).toBe('high');
      expect(res.toxicityScores.threats).toBeGreaterThanOrEqual(0.8);
    });

    it('auto-hides severe harassment and slurs', () => {
      const res = screenContent('You are a worthless piece of shit go die');
      expect(res.action).toBe('auto_hide');
      expect(res.severity).toBe('high');
      expect(res.toxicityScores.harassment).toBeGreaterThanOrEqual(0.8);
    });

    it('auto-hides crypto/social spam', () => {
      const res = screenContent('Join my channel for free crypto signals telegram: @cryptos');
      expect(res.action).toBe('auto_hide');
      expect(res.severity).toBe('high');
      expect(res.toxicityScores.spam).toBeGreaterThanOrEqual(0.8);
    });
  });

  describe('Clean Campus Publications', () => {
    it('publishes legitimate student posts with zero flags', () => {
      const res = screenContent(
        'Anyone want to form a study group for Organic Chemistry II on the 2nd floor of the library?'
      );
      expect(res.hasPII).toBe(false);
      expect(res.isCrisis).toBe(false);
      expect(res.action).toBe('publish');
      expect(res.severity).toBe('low');
    });

    it('allows normal discussions with numbers that are not IDs or phones', () => {
      const res = screenContent('Scored an 88 on the exam today! Chapter 3 was tricky.');
      expect(res.hasPII).toBe(false);
      expect(res.action).toBe('publish');
    });
  });
});
