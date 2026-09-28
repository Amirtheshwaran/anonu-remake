export const AnonUConstants = {
  // Feed
  postsPerPage: 20,
  hotScoreThreshold: 10,
  autoHideThreshold: -5,

  // Post limits
  maxPostLength: 280,
  maxCommentLength: 200,
  maxPollOptions: 4,
  maxTags: 5,
  maxImages: 4,

  // Time-limited posts (hours)
  timeLimitOptions: [1, 6, 12, 24, 48] as const,

  // Mood options
  moods: [
    { emoji: '🔥', label: 'Hyped' },
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Meh' },
    { emoji: '😓', label: 'Stressed' },
    { emoji: '😞', label: 'Low' },
    { emoji: '😴', label: 'Tired' },
  ],

  // Popular campus tags
  suggestedTags: [
    'academics', 'mental-health', 'campus-life', 'advice', 'rant',
    'confession', 'humor', 'events', 'relationships', 'career',
    'housing', 'food', 'sports', 'study', 'late-night',
  ],

  adjectives: [
    'Amber', 'Azure', 'Blazing', 'Bold', 'Calm', 'Crimson', 'Cyan',
    'Daring', 'Dim', 'Dusty', 'Electric', 'Emerald', 'Faint', 'Fierce',
    'Frosty', 'Gilded', 'Glowing', 'Golden', 'Grave', 'Hollow', 'Indigo',
    'Iron', 'Jade', 'Keen', 'Lunar', 'Marble', 'Midnight', 'Misty',
    'Murky', 'Neon', 'Noble', 'Obsidian', 'Pale', 'Phantom', 'Prism',
    'Quiet', 'Radiant', 'Raven', 'Russet', 'Sacred', 'Scarlet', 'Shadow',
    'Silver', 'Sleek', 'Solar', 'Stark', 'Steel', 'Storm', 'Swift',
    'Tawny', 'Titan', 'Twilight', 'Verdant', 'Violet', 'Vivid', 'Wild',
    'Winter', 'Wired', 'Woven', 'Zeal',
  ],

  animals: [
    'Albatross', 'Badger', 'Bear', 'Beetle', 'Bison', 'Bobcat', 'Cassowary',
    'Chameleon', 'Cobra', 'Condor', 'Cormorant', 'Coyote', 'Crane', 'Dingo',
    'Dolphin', 'Eagle', 'Falcon', 'Ferret', 'Fox', 'Gecko', 'Goshawk',
    'Harrier', 'Hawk', 'Heron', 'Ibis', 'Jackal', 'Jaguar', 'Kestrel',
    'Kingfisher', 'Kite', 'Lemur', 'Leopard', 'Linnet', 'Lynx', 'Magpie',
    'Marten', 'Merlin', 'Mongoose', 'Nightjar', 'Osprey', 'Otter', 'Owl',
    'Panther', 'Peregrine', 'Phoenix', 'Puffin', 'Python', 'Raven', 'Salamander',
    'Sandpiper', 'Serval', 'Shrike', 'Skua', 'Sparrowhawk', 'Stag', 'Starling',
    'Stoat', 'Swift', 'Teal', 'Tiger', 'Viper', 'Warbler', 'Weasel', 'Wolf',
  ],
} as const;
