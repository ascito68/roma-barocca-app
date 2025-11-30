export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Stop {
  id: string;
  name: string;
  description: string;
  coordinates: Coordinates;
  arrivalTime: string;
  departureTime: string;
  artists: string[];
  tips?: string;
  type: 'start' | 'stop' | 'end';
}

export interface Itinerary {
  title: string;
  date: string;
  stops: Stop[];
  totalDistance?: string;
  totalTime?: string;
}

export interface UserPreferences {
  startTime: string;
  participants: number;
  pace: 'relaxed' | 'moderate' | 'intense';
  accessibility: boolean;
  focusArtists: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: Array<{ title: string; uri: string }>;
}
