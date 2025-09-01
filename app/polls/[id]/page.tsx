"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Users, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Creator, Poll, PollOption, Vote as VoteType } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

// Initialize FingerprintJS
const fpPromise = FingerprintJS.load();

async function getFingerprint() {
  const fp = await fpPromise;
  const result = await fp.get();
  return result.visitorId; // unique per browser/device
}

export default function Vote() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasVoted, setHasVoted] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const { user } = useAuth();

  // Generate fingerprint on component mount
  useEffect(() => {
    if (!user?.id) {
      getFingerprint().then(setFingerprint);
    }
  }, [user?.id]);

  // Consistent voter identifier
  const voterIdentifier = user?.id || fingerprint;

  //   data: poll,
  //   // creator: string,
  //   isLoading,
  //   error,
  // } = useQuery({
  //   queryKey: ["poll", id],

  //   queryFn: async () => {
  //     console.log("RUNNING QUERY");
  //     const { data, error } = await supabase
  //       .from("polls")
  //       .select("*")
  //       .eq("id", id)
  //       .single();

  //     if (error) {
  //       throw error;
  //     }
  //     console.log({ data });
  //     return data as Poll;
  //   },
  //   enabled: !!id, // Only enable the query if id is available
  // });

  // Fetch poll data
  const {
    data: poll,
    isLoading: pollLoading,
    error: pollError,
  } = useQuery<Poll>({
    queryKey: ["poll", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }
      return data as Poll;
    },
  });

  // Fetch poll options
  const {
    data: pollOptions = [],
    isLoading: optionsLoading,
    error: optionsError,
  } = useQuery<PollOption[]>({
    queryKey: ["poll-options", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", id)
        .order("option_order");

      if (error) {
        throw error;
      }
      return data as PollOption[];
    },
  });

  // Fetch creator info
  const { data: creator, isLoading: creatorLoading } = useQuery<Creator>({
    queryKey: ["creator", poll?.creator_id],
    enabled: !!poll?.creator_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", poll!.creator_id)
        .single();

      if (error) {
        // Fallback to auth.users if profiles table doesn't exist
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", poll!.creator_id)
          .single();

        if (userError) {
          return { id: poll!.creator_id, name: "Unknown" };
        }
        return userData as Creator;
      }
      return data as Creator;
    },
  });

  // Check if user has already voted
  const { data: existingVote, isLoading: voteCheckLoading } = useQuery({
    queryKey: ["user-vote", id, voterIdentifier],
    enabled: !!id && !!voterIdentifier,
    queryFn: async () => {
      if (!voterIdentifier) return null;

      if (user?.id) {
        // For logged-in users, check by user_id
        const { data, error } = await supabase
          .from("votes")
          .select("*")
          .eq("poll_id", id)
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }
        return data;
      } else {
        // For anonymous users, check multiple identifiers
        const userAgent = navigator.userAgent;
        let ip;
        try {
          const response = await fetch("https://api.ipify.org?format=json");
          const ipData = await response.json();
          ip = ipData.ip;
        } catch (error) {
          console.warn("Failed to get IP for duplicate check:", error);
        }

        // Check by fingerprint first
        const { data: fingerprintVote } = await supabase
          .from("votes")
          .select("*")
          .eq("poll_id", id)
          .eq("voter_fingerprint", fingerprint)
          .single();

        if (fingerprintVote) return fingerprintVote;

        // Check by IP address (if available)
        if (ip) {
          const { data: ipVote } = await supabase
            .from("votes")
            .select("*")
            .eq("poll_id", id)
            .eq("voter_ip", ip)
            .single();

          if (ipVote) return ipVote;
        }

        // Check by user agent (less reliable but additional layer)
        if (userAgent) {
          const { data: uaVote } = await supabase
            .from("votes")
            .select("*")
            .eq("poll_id", id)
            .eq("user_agent", userAgent)
            .single();

          if (uaVote) return uaVote;
        }

        return null;
      }
    },
  });

  // Check both user_id and fingerprint-based votes
  //     let query = supabase.from("votes").select("*").eq("poll_id", id);

  //     if (user?.id) {
  //       // For logged-in users, check by user_id
  //       query = query.eq("voter_id", user.id);
  //     } else {
  //       // For anonymous users, check by fingerprint
  //       query = query.eq("voter_fingerprint", fingerprint);
  //     }

  //     const { data, error } = await query.single();

  //     if (error && error.code !== "PGRST116") {
  //       // PGRST116 = no rows returned
  //       throw error;
  //     }
  //     return data;
  //   },
  // });

  // Get current vote counts
  const { data: allVotes = [] } = useQuery<VoteType[]>({
    queryKey: ["votes", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("*")
        .eq("poll_id", id);

      if (error) {
        throw error;
      }
      return data as VoteType[];
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (option: PollOption) => {
      if (!voterIdentifier) {
        throw new Error("Unable to identify voter");
      }

      // Get additional identification data
      const userAgent = navigator.userAgent;
      let ip;
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const ipData = await response.json();
        ip = ipData.ip;
      } catch (error) {
        console.warn("Failed to get IP:", error);
      }

      // Enhanced duplicate check before submitting
      if (user?.id) {
        const { data } = await supabase
          .from("votes")
          .select("id")
          .eq("poll_id", id)
          .eq("user_id", user.id)
          .single();

        if (data) {
          throw new Error("You have already voted in this poll");
        }
      } else {
        // Multi-layer check for anonymous users
        const checks = [];

        // Check by fingerprint
        if (fingerprint) {
          checks.push(
            supabase
              .from("votes")
              .select("id")
              .eq("poll_id", id)
              .eq("voter_fingerprint", fingerprint)
              .single()
          );
        }

        // Check by IP
        if (ip) {
          checks.push(
            supabase
              .from("votes")
              .select("id")
              .eq("poll_id", id)
              .eq("voter_ip", ip)
              .single()
          );
        }

        // Check by user agent (weaker but still useful)
        if (userAgent) {
          checks.push(
            supabase
              .from("votes")
              .select("id")
              .eq("poll_id", id)
              .eq("user_agent", userAgent)
              .single()
          );
        }

        const results = await Promise.allSettled(checks);
        const hasExistingVote = results.some(
          (result) => result.status === "fulfilled" && result.value.data
        );

        if (hasExistingVote) {
          throw new Error(
            "A vote from this device/network has already been recorded for this poll"
          );
        }
      }

      // Build vote data object, only including non-null/non-empty values
      const voteData = {
        poll_id: id as string,
        poll_option_id: option.id,
        ...(ip && { voter_ip: ip }),
        ...(userAgent && { user_agent: userAgent }),
      };

      if (user?.id) {
        voteData.voter_id = user.id;
        // Don't include voter_fingerprint or anonymous_id for logged-in users
      } else if (fingerprint) {
        voteData.voter_fingerprint = fingerprint;
        voteData.anonymous_id = `anonymous_${Date.now()}_${fingerprint}`;
      } else {
        throw new Error("Unable to identify anonymous voter");
      }

      const { data, error } = await supabase
        .from("votes")
        .insert([voteData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update poll option vote count
      const { error: updateError } = await supabase
        .from("poll_options")
        .update({
          vote_count: option.vote_count + 1,
        })
        .eq("id", option.id);

      if (updateError) {
        console.warn("Failed to update option vote count:", updateError);
      }

      // Update poll total votes count
      const { error: pollUpdateError } = await supabase
        .from("polls")
        .update({
          total_votes: poll!.total_votes + 1,
          vote_count: poll!.vote_count + 1,
        })
        .eq("id", id as string);

      if (pollUpdateError) {
        console.warn("Failed to update poll vote count:", pollUpdateError);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["poll", id] });
      queryClient.invalidateQueries({ queryKey: ["votes", id] });
      queryClient.invalidateQueries({ queryKey: ["poll-options", id] });
      queryClient.invalidateQueries({ queryKey: ["user-vote", id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["polls", user?.id] });

      setHasVoted(true);
      toast({
        title: "Vote Cast!",
        description: "Thank you for participating in this poll.",
      });

      // Redirect to results after a short delay
      setTimeout(() => {
        router.push(`/polls/${id}/results`);
      }, 1500);
    },
    onError: (error) => {
      console.error("Vote error:", error);

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to cast vote",
        variant: "destructive",
      });
    },
  });

  const handleVote = (option: PollOption) => {
    if (hasVoted || voteMutation.isPending || existingVote || !voterIdentifier)
      return;
    voteMutation.mutate(option);
  };

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, etc.
  };

  const isLoading =
    pollLoading ||
    optionsLoading ||
    creatorLoading ||
    voteCheckLoading ||
    (!user?.id && !fingerprint);
  const hasError = pollError || optionsError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (hasError || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">
              Poll Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The poll you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
            <Button onClick={() => router.push("/")} data-testid="button-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">
              Poll Ended
            </h1>
            <p className="text-muted-foreground mb-6">
              This poll is no longer accepting votes.
            </p>
            <Button
              onClick={() => router.push(`/polls/${id}/results`)}
              data-testid="button-results"
            >
              View Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user already voted
  if (existingVote) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">
              Already Voted
            </h1>
            <p className="text-muted-foreground mb-6">
              You have already cast your vote for this poll.
            </p>
            <Button
              onClick={() => router.push(`/polls/${id}/results`)}
              data-testid="button-view-results"
            >
              View Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-sm border border-border">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="text-primary-foreground text-lg" />
              </div>
              <h1
                className="text-2xl font-bold text-foreground mb-2"
                data-testid="text-poll-title"
              >
                {poll.title}
              </h1>
              {poll.description && (
                <p
                  className="text-muted-foreground"
                  data-testid="text-poll-description"
                >
                  {poll.description}
                </p>
              )}
              <p className="text-muted-foreground mt-2">
                Choose one option below
              </p>
            </div>

            {/* Interactive Voting Options */}
            <div className="space-y-5 mb-8">
              {pollOptions.map((option, index) => (
                <div
                  key={option.id}
                  className={`poll-option ${
                    voteMutation.isPending || hasVoted
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:shadow-md"
                  }`}
                  onClick={() => handleVote(option)}
                  data-testid={`button-option-${index}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-6 h-6 border-3 border-muted-foreground rounded-full group-hover:border-primary transition-all duration-300 group-hover:scale-110"></div>
                        <div className="absolute inset-0 w-6 h-6 rounded-full bg-primary opacity-0 group-hover:opacity-20 scale-50 group-hover:scale-100 transition-all duration-300"></div>
                      </div>
                      <div className="flex-1">
                        <span className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                          {option.option_text}
                        </span>
                        <div className="text-sm text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Click to vote for this option
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        {getOptionLabel(index)}
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Poll Info */}
            <div className="text-center text-sm text-muted-foreground border-t border-border pt-6">
              <div className="flex items-center justify-center space-x-6">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span
                    className="number-counter"
                    data-testid="text-vote-count"
                  >
                    {allVotes.length}
                  </span>{" "}
                  votes
                </span>
                <span>
                  Created by {creator?.name || creator?.email || "Unknown"}
                </span>
                <span>{new Date(poll.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {hasVoted && (
              <div className="mt-6 text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    Vote submitted successfully!
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Redirecting to results...
                  </p>
                </div>
              </div>
            )}

            {voteMutation.isPending && (
              <div className="mt-6 text-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">
                    Submitting your vote...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
