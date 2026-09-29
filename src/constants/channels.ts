export interface ChannelInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  accentColor: string;
}

export const CAMPUS_CHANNELS: ChannelInfo[] = [
  {
    id: 'General',
    name: 'General',
    emoji: '💬',
    description: 'Campus-wide pulse, daily rants, and open discussions',
    accentColor: '#FFE600',
  },
  {
    id: 'Classes',
    name: 'Classes',
    emoji: '📚',
    description: 'Professors, exams, homework questions, and study groups',
    accentColor: '#00F090',
  },
  {
    id: 'Housing',
    name: 'Housing',
    emoji: '🏠',
    description: 'Subleases, dorm reviews, and roommate searching',
    accentColor: '#00E5FF',
  },
  {
    id: 'Marketplace',
    name: 'Marketplace',
    emoji: '🏷️',
    description: 'Textbooks, furniture, football tickets, and electronics',
    accentColor: '#FF5C93',
  },
  {
    id: 'Events',
    name: 'Events',
    emoji: '🎉',
    description: 'Parties, club meetups, campus sports, and hackathons',
    accentColor: '#A388EE',
  },
  {
    id: 'LostAndFound',
    name: 'Lost & Found',
    emoji: '🔍',
    description: 'Lost student IDs, AirPods, keys, and campus gear',
    accentColor: '#FF5A1F',
  },
];

export const CHANNEL_IDS = CAMPUS_CHANNELS.map((c) => c.id);
