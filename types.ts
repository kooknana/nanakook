
export interface Channel {
  name: string;
  subscribers: string;
  url: string;
}

export interface Strategy {
  type: 'general' | 'niche';
  title: string;
  description: string;
  competition: 'Low' | 'Medium' | 'High';
  difficulty: number; // 1-5
  estimatedCpm: string;
  ideas: string[];
}

export interface AnalysisData {
  region: string;
  category: string;
  cpmRange: string;
  stats: {
    relatedChannels: string;
    relatedVideos: string;
    avgSubscribers: string;
    competitionIntensity: 'Low' | 'Medium' | 'High';
  };
  topChannels: Channel[];
  insights: string[];
  strategies: Strategy[];
}

export interface LogEntry {
  id: string;
  agent: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'success' | 'warning' | 'ai';
}
