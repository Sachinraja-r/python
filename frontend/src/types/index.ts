export interface Module {
  id: number;
  name: string;
  order_index: number;
  track: string;
  theory: {
    explanation: string;
    examples: {
      label: string;
      code: string;
      output: string;
    }[];
  };
}

export interface Level {
  id: number;
  module_id: number | null;
  title: string;
  description: string;
  starter_code: string;
  hints: string[];
  order_index: number;
  is_gate: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface UserProgress {
  level_id: number;
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed';
  attempts: number;
}

export interface SubmissionResponse {
  passed: boolean;
  message?: string;
  next_level_id?: number;
}
