export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'premium';
  role?: string;
  pollCreationCount: number;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface PollSettings {
  anonymousVoting: boolean;
  requireAuth: boolean;
  allowMultipleVotes: boolean;
  showResultsLive: boolean;
  theme: string;
}

export interface Poll {
  id: string;
  code: string;
  ownerId: string;
  ownerName: string;
  question: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  status: 'active' | 'closed';
  settings: PollSettings;
  createdAt: string;
  updatedAt: string;
}

export interface PlanUsageInfo {
  plan: 'free' | 'premium';
  pollCreationCount: number;
  maxPolls: number;
  remainingPolls: number;
  isUnlimited: boolean;
  canCreatePoll: boolean;
}

export interface PlanTier {
  id: string;
  name: string;
  price: number;
  interval: string;
  pollLimit: number;
  isUnlimited?: boolean;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface VoteActivityItem {
  id: string;
  voterName: string;
  optionId: string;
  optionText: string;
  createdAt: string;
}
