class AnonUConstants {
  // Pseudonym generation (YikYak style)
  static const List<String> adjectives = [
    'Amber', 'Azure', 'Blazing', 'Bold', 'Calm', 'Crimson', 'Cyan',
    'Daring', 'Dim', 'Dusty', 'Electric', 'Emerald', 'Faint', 'Fierce',
    'Frosty', 'Gilded', 'Glowing', 'Golden', 'Grave', 'Hollow', 'Indigo',
    'Iron', 'Jade', 'Keen', 'Lunar', 'Marble', 'Midnight', 'Misty',
    'Murky', 'Neon', 'Noble', 'Obsidian', 'Pale', 'Phantom', 'Prism',
    'Quiet', 'Radiant', 'Raven', 'Russet', 'Sacred', 'Scarlet', 'Shadow',
    'Silver', 'Sleek', 'Solar', 'Stark', 'Steel', 'Storm', 'Swift',
    'Tawny', 'Titan', 'Twilight', 'Verdant', 'Violet', 'Vivid', 'Wild',
    'Winter', 'Wired', 'Woven', 'Zeal',
  ];

  static const List<String> animals = [
    'Albatross', 'Badger', 'Bear', 'Beetle', 'Bison', 'Bobcat', 'Cassowary',
    'Chameleon', 'Cobra', 'Condor', 'Cormorant', 'Coyote', 'Crane', 'Dingo',
    'Dolphin', 'Eagle', 'Falcon', 'Ferret', 'Fox', 'Gecko', 'Goshawk',
    'Harrier', 'Hawk', 'Heron', 'Ibis', 'Jackal', 'Jaguar', 'Kestrel',
    'Kingfisher', 'Kite', 'Lemur', 'Leopard', 'Linnet', 'Lynx', 'Magpie',
    'Marten', 'Merlin', 'Mongoose', 'Nightjar', 'Osprey', 'Otter', 'Owl',
    'Panther', 'Peregrine', 'Phoenix', 'Puffin', 'Python', 'Raven', 'Salamander',
    'Sandpiper', 'Serval', 'Shrike', 'Skua', 'Sparrowhawk', 'Stag', 'Starling',
    'Stoat', 'Swift', 'Teal', 'Tiger', 'Viper', 'Warbler', 'Weasel', 'Wolf',
  ];

  // Feed
  static const int postsPerPage = 20;
  static const int hotScoreThreshold = 10;
  static const int autoHideThreshold = -5;

  // Post limits
  static const int maxPostLength = 280;
  static const int maxCommentLength = 200;
  static const int maxPollOptions = 4;
  static const int maxTags = 5;
  static const int maxImages = 4;

  // Time-limited posts (hours)
  static const List<int> timeLimitOptions = [1, 6, 12, 24, 48];

  // Mood options
  static const List<Map<String, String>> moods = [
    {'emoji': '🔥', 'label': 'Hyped'},
    {'emoji': '😊', 'label': 'Good'},
    {'emoji': '😐', 'label': 'Meh'},
    {'emoji': '😓', 'label': 'Stressed'},
    {'emoji': '😞', 'label': 'Low'},
    {'emoji': '😴', 'label': 'Tired'},
  ];

  // Popular tags
  static const List<String> suggestedTags = [
    'academics', 'mental-health', 'campus-life', 'advice', 'rant',
    'confession', 'humor', 'events', 'relationships', 'career',
    'housing', 'food', 'sports', 'study', 'late-night',
  ];
}
