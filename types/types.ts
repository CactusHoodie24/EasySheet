// types.ts
export interface FormInput {
  field: string;
  type: string;
  options?: string[];
  required?: boolean;
}

export interface FormEntry {
  id: string;
  title: string;
  inputs: FormInput[];
  userId: string;
  createdAt?: string;
}

export interface FormValue {
  id: string;
  entryId: string;
  userId: string;
  values: Record<string, any>;
  createdAt?: string;
}

export interface OverallWeeklyStats {
  Monday: number;
  Tuesday: number;
  Wednesday: number;
  Thursday: number;
  Friday: number;
  Saturday: number;
  Sunday: number;
}

export interface GroupData {
  groupId: string;
  groupName: string;
  memberSubmissionCounts: Record<string, number>;
  questionnaireIds: string[];
}

export interface UserGroupStat {
  groupId: string;
  groupName: string;
  userSubmissionCount: number;
}

export interface QuestionnaireTarget {
  id: string;
  title: string;
  dailyTarget: number;
  weeklyTarget: number;
  requiredTarget: number;
  dailyCollected: number;
  weeklyCollected: number;
  requiredCollected: number;
  groupId: string;
}

export interface UserData {
  entries: FormEntry[];
  weed: FormValue[];
  totalCount: number;
  groups: GroupData[];
  userGroupStats: UserGroupStat[];
  overallWeeklyStats: OverallWeeklyStats;
  questionnaireTargets: QuestionnaireTarget[];
}

export interface UserDataContextType {
  data: UserData | null;
  loading: boolean;
  refresh: () => Promise<void>;
  error: boolean;            // <- new
  lastUpdated: number | null; 
}
