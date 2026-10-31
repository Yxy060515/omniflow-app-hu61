// Shared transit contracts between backend routes and frontend consumers.

export type RouteId = '1' | '2';
export type CrowdLevel = 'idle' | 'normal' | 'crowded' | 'full';
export type Trend = 'up' | 'flat' | 'down';

export interface StopInfo {
  index: number;
  name: string;
  segment: 'outbound' | 'return' | null;
  queue: number;
  trend: Trend;
  offline: boolean;
}

export interface BusInfo {
  id: string;
  routeId: RouteId;
  position: number;
  load: number;
  capacity: number;
  ratio: number;
  level: CrowdLevel;
  confidence: number;
  nextStopIndex: number;
  nextStopName: string;
}

export interface ArrivalInfo {
  busId: string;
  routeId: RouteId;
  etaMin: number;
  stopsAway: number;
  load: number;
  level: CrowdLevel;
  remainingSeats: number;
  verdict: 'likely' | 'unlikely';
}

export interface RouteOverview {
  routeId: RouteId;
  name: string;
  direction: string;
  stops: StopInfo[];
  buses: BusInfo[];
  arrivals: ArrivalInfo[];
}

export interface CollegeHeat {
  college: string;
  stopName: string;
  queue: number;
  ratio: number;
  trend: Trend;
}

export type AdviceAction = 'go_now' | 'wait' | 'switch_route' | 'walk' | 'closed';

export interface AdviceInfo {
  action: AdviceAction;
  title: string;
  summary: string;
  confidence: number;
  lowConfidence: boolean;
  simplified: boolean;
  basis: { label: string; value: string }[];
}

export interface TripPlan {
  id: string;
  title: string;
  routeId: RouteId;
  boardTime: string;
  etaMin: number;
  walkMin: number;
  level: CrowdLevel;
  seats: number;
  note: string;
}

export interface SelectedStopInfo {
  name: string;
  queue: number;
  trend: Trend;
  offline: boolean;
}

export interface TransitOverview {
  updatedAt: string;
  closed: boolean;
  peakDemo: boolean;
  capacity: number;
  selectedStop: SelectedStopInfo;
  routes: RouteOverview[];
  colleges: CollegeHeat[];
  advice: AdviceInfo;
  plans: TripPlan[];
  feedbackCount: number;
}

export interface SubmitFeedbackRequest {
  routeId: RouteId;
  level: CrowdLevel;
  clientId: string;
  stopName?: string;
  busId?: string;
}

export interface FeedbackResult {
  id: string;
  level: CrowdLevel;
  createdAt: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatTurn[];
  stop?: string;
  peak?: boolean;
}
