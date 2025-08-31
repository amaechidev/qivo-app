// Define the Poll interface for type safety
export interface Poll {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  is_active: boolean;
  is_public: boolean;
  require_auth: boolean;
  options: string[];
  vote_count: number;
  creator_id: string;
  created_at: string;
  expires_at: string;

  total_votes: number;
  unique_voters: number;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  option_order: number;
  vote_count: number;
  created_at: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  poll_option_id: string;
  voter_id: string;
  voter_ip: string;
  voter_fingerprint: string;
  user_agent: string;
  created_at: Date;
}

export interface Creator {
  id: string;
  name: string;
  email?: string;
  full_name?: string;
}
