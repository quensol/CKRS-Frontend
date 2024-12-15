export interface AnalysisBrief {
  id: number
  seed_keyword: string
  status: "pending" | "processing" | "completed" | "failed"
  total_search_volume: number
  seed_search_volume: number
  seed_search_ratio: number
  error_message?: string
  created_at: string
}

export interface AnalysisDetail extends AnalysisBrief {
  user_profiles: UserProfile[]
  cooccurrence_keywords: Cooccurrence[]
  search_volumes: SearchVolume[]
  competitors: Competitor[]
}

export interface Cooccurrence {
  id: number
  keyword: string
  cooccurrence_count: number
  created_at: string
}

export interface SearchVolume {
  id: number
  mediator_keyword: string
  cooccurrence_volume: number
  mediator_total_volume: number
  cooccurrence_ratio: number
  weight: number
}

export interface Competitor {
  id: number
  competitor_keyword: string
  mediator_keywords: string
  cooccurrence_volume: number
  base_competition_score: number
  weighted_competition_score: number
}

export interface UserProfile {
  profile_type: "age" | "gender" | "education"
  category_value: number
  user_count: number
  percentage: number
  created_at: string
}

export interface UserProfileStats {
  total_users: number
  avg_age: number
  male_ratio: number
  female_ratio: number
  avg_education: number
  created_at: string
}

export type AnalysisData = 
  | AnalysisDetail
  | Cooccurrence[] 
  | SearchVolume[] 
  | Competitor[]
  | UserProfile[]

export interface AnalysisResultsProps {
  analysisId: number
  type: "overview" | "cooccurrence" | "volume" | "competitors"
}