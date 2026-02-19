import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';

export interface Resolution {
  id: string;
  text: string;
  isCompleted: boolean;
  proposer?: string;
  proof?: string;
  status: 'tocomplete' | 'pending' | 'completed' | 'rejected';  // TODO: check if we need this
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: ImagePlaceholder;
  resolutions: Resolution[];
}

export interface Team {
  id: string;
  name: string;
  teamResolution: Resolution;
  leader: User;
  members: { user: User; bingoCard: Resolution[] }[];
}

const userAvatars = {
  you: PlaceHolderImages.find((img) => img.id === 'avatar-5')!,
  sarah: PlaceHolderImages.find((img) => img.id === 'avatar-1')!,
  mike: PlaceHolderImages.find((img) => img.id === 'avatar-2')!,
  emily: PlaceHolderImages.find((img) => img.id === 'avatar-3')!,
  david: PlaceHolderImages.find((img) => img.id === 'avatar-4')!,
};

export const users: User[] = [
  {
    id: 'user-1',
    name: 'You',
    email: 'you@example.com',
    avatar: userAvatars.you,
    resolutions: [
      { id: 'res-1-1', text: 'Run a 5k race', isCompleted: false, status: 'tocomplete' },
      { id: 'res-1-2', text: 'Read 12 books', isCompleted: false, status: 'tocomplete' },
      { id: 'res-1-3', text: 'Learn to play guitar', isCompleted: true, status: 'completed' },
      { id: 'res-1-4', text: 'Save $1000', isCompleted: false, status: 'tocomplete' },
      { id: 'res-1-5', text: 'Volunteer twice', isCompleted: false, status: 'tocomplete' },
      { id: 'res-1-6', text: 'Cook a new recipe each week', isCompleted: false, status: 'pending' },
    ],
  },
  {
    id: 'user-2',
    name: 'Sarah',
    email: 'sarah@example.com',
    avatar: userAvatars.sarah,
    resolutions: [
      { id: 'res-2-1', text: 'Go hiking once a month', isCompleted: true, status: 'completed' },
      { id: 'res-2-2', text: 'Start a journal', isCompleted: false, status: 'tocomplete' },
    ],
  },
  {
    id: 'user-3',
    name: 'Mike',
    email: 'mike@example.com',
    avatar: userAvatars.mike,
    resolutions: [
      { id: 'res-3-1', text: 'Complete a coding challenge', isCompleted: false, status: 'tocomplete' },
      { id: 'res-3-2', text: 'Visit a new country', isCompleted: false, status: 'tocomplete' },
    ],
  },
  {
    id: 'user-4',
    name: 'Emily',
    email: 'emily@example.com',
    avatar: userAvatars.emily,
    resolutions: [
      { id: 'res-4-1', text: 'Take a painting class', isCompleted: true, status: 'completed' },
      { id: 'res-4-2', text: 'Try meditation for 30 days', isCompleted: false, status: 'pending' },
    ],
  },
  {
    id: 'user-5',
    name: 'David',
    email: 'david@example.com',
    avatar: userAvatars.david,
    resolutions: [
      { id: 'res-5-1', text: 'Build a PC', isCompleted: false, status: 'tocomplete' },
      { id: 'res-5-2', text: 'Learn a magic trick', isCompleted: false, status: 'tocomplete' },
    ],
  },
];

const [you, sarah, mike, emily, david] = users;

const generateBingoCard = (user: User, team: Team): Resolution[] => {
  const card: Resolution[] = [];
  // Team Resolution
  card.push({ ...team.teamResolution, proposer: 'Team Goal' });
  
  // Resolutions from other members
  team.members.forEach(member => {
    if (member.user.id !== user.id) {
      card.push({ id: `prop-${member.user.id}-${user.id}`, text: `Proposed by ${member.user.name}`, isCompleted: false, status: 'tocomplete', proposer: member.user.name });
    }
  });

  // Fill with personal resolutions
  let personalIndex = 0;
  while(card.length < 24) {
    if (personalIndex < user.resolutions.length) {
      card.push(user.resolutions[personalIndex]);
      personalIndex++;
    } else {
      // Fill with empty if not enough
      card.push({ id: `empty-${card.length}`, text: 'Empty Slot', isCompleted: false, status: 'tocomplete', proposer: 'Empty' });
    }
  }

  // Shuffle and add Joker
  const shuffled = card.sort(() => 0.5 - Math.random()).slice(0, 24);
  const joker: Resolution = { id: 'joker', text: 'Joker', isCompleted: true, status: 'completed', proposer: 'Bingo' };
  shuffled.splice(12, 0, joker);

  return shuffled;
}

export const teams: Team[] = [
  {
    id: 'team-1',
    name: 'Goal Getters 2024',
    teamResolution: { id: 'team-res-1', text: 'Complete a team charity walk', isCompleted: false, status: 'tocomplete' },
    leader: you,
    members: [
      { user: you, bingoCard: [] },
      { user: sarah, bingoCard: [] },
      { user: mike, bingoCard: [] },
    ],
  },
  {
    id: 'team-2',
    name: 'The Resolutionaries',
    teamResolution: { id: 'team-res-2', text: 'Host a team potluck dinner', isCompleted: false, status: 'tocomplete' },
    leader: emily,
    members: [
      { user: emily, bingoCard: [] },
      { user: david, bingoCard: [] },
      { user: you, bingoCard: [] },
    ],
  },
];

// Generate bingo cards for all members
teams.forEach(team => {
  team.members.forEach(member => {
    member.bingoCard = generateBingoCard(member.user, team);
  });
});
