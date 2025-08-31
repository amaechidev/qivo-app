"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Users, Share, QrCode, Download, Copy } from "lucide-react";
import { useState } from "react";
import QRModal from "@/components/qr-modal";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PollOption, Vote } from "@/types";

export default function Results() {
  const { id } = useParams();
  const { toast } = useToast();
  const [showQRModal, setShowQRModal] = useState(false);
  const router = useRouter();

  console.log({ id });

  // Fetch poll data
  const {
    data: poll,
    isLoading: pollLoading,
    error: pollError,
  } = useQuery({
    queryKey: ["poll", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .select("*")
        .eq("id", id)
        .single();

      if (pollError) throw pollError;
      if (!poll) return null;

      // Get the creator profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", poll.creator_id)
        .single();

      return {
        ...poll,
        creator: profile, // Use 'creator' instead of 'profiles' for cleaner access
      };
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

  // Fetch votes
  const {
    data: votes = [],
    isLoading: votesLoading,
    error: votesError,
  } = useQuery<Vote[]>({
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
      return data as Vote[];
    },
  });

  // Fetch creator info
  // const {
  //   data: creator,
  //   isLoading: creatorLoading,
  //   error: creatorError,
  // } = useQuery<Creator>({
  //   queryKey: ["creator", poll?.creator_id],
  //   enabled: !!poll?.creator_id,
  //   queryFn: async () => {
  //     if (!poll?.creator_id) throw new Error("No creator id");

  //     const { data, error } = await supabase
  //       .from("profiles") // Assuming you have a profiles table
  //       .select("id, name, email")
  //       .eq("id", poll!.creator_id)
  //       .single();

  //     if (error) {
  //       throw error;
  //     }

  //     return data as Creator;
  //   },
  // });

  console.log("pollOptions:", pollOptions);
  console.log("votes:", votes);
  console.log("poll:", poll);
  // console.log("creator:", );

  const copyLink = async () => {
    const link = `${window.location.origin}/poll/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied!",
        description: "Poll link copied to clipboard",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please copy manually: " + link,
        variant: "destructive",
      });
    }
  };

  const shareResults = async () => {
    const link = `${window.location.origin}/poll/${id}/results`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: poll?.title,
          text: `Check out the results of this poll: ${poll?.title}`,
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
        toast({
          title: "Results Link Copied!",
          description: "Results link copied to clipboard",
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Handle share cancellation silently
    }
  };

  const exportData = () => {
    if (!poll || !pollOptions) return;

    // Calculate vote counts for each option
    const voteCounts: { [key: string]: number } = {};
    pollOptions.forEach((option) => {
      voteCounts[option.id] = 0;
    });

    votes.forEach((vote) => {
      if (
        vote.poll_option_id &&
        voteCounts.hasOwnProperty(vote.poll_option_id)
      ) {
        voteCounts[vote.poll_option_id]++;
      }
    });

    const totalVotes = votes.length;

    const data = {
      title: poll.title,
      description: poll.description,
      totalVotes: totalVotes,
      uniqueVoters: poll.unique_voters,
      results: pollOptions.map((option) => {
        const voteCount = voteCounts[option.id] || 0;
        return {
          option: option.option_text,
          votes: voteCount,
          percentage:
            totalVotes > 0
              ? ((voteCount / totalVotes) * 100).toFixed(1)
              : "0.0",
        };
      }),
      createdAt: poll.created_at,
      createdBy: poll?.creator?.name || "Unknown",
      isActive: poll.is_active,
      expiresAt: poll.expires_at,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poll-results-${poll.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported!",
      description: "Poll results downloaded as JSON",
    });
  };

  // Calculate vote data
  const getVoteData = () => {
    if (!votes || !pollOptions) return { results: [], totalVotes: 0 };

    const voteCounts: { [key: string]: number } = {};
    pollOptions.forEach((option) => {
      voteCounts[option.id] = 0;
    });

    votes.forEach((vote) => {
      if (
        vote.poll_option_id &&
        voteCounts.hasOwnProperty(vote.poll_option_id)
      ) {
        voteCounts[vote.poll_option_id]++;
      }
    });

    const totalVotes = votes.length;

    const results = pollOptions.map((option) => {
      const count = voteCounts[option.id] || 0;
      const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;

      return {
        option: option.option_text,
        count,
        percentage,
        optionId: option.id,
        optionOrder: option.option_order,
      };
    });

    return { results: results.sort((a, b) => b.count - a.count), totalVotes };
  };

  const isLoading = pollLoading || optionsLoading || votesLoading;
  const hasError = pollError || optionsError || votesError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
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

  const { results: sortedResults, totalVotes } = getVoteData();

  const colors = [
    "hsl(217, 91%, 60%)", // Primary blue
    "hsl(142, 76%, 36%)", // Natural green
    "hsl(38, 92%, 50%)", // Warm orange
    "hsl(271, 91%, 65%)", // Purple
    "hsl(0, 84%, 60%)", // Red
    "hsl(195, 100%, 50%)", // Cyan
    "hsl(300, 100%, 70%)", // Pink
    "hsl(60, 100%, 50%)", // Yellow
    "hsl(120, 100%, 25%)", // Deep green
    "hsl(15, 100%, 55%)", // Red orange
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-sm border border-border">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Poll Results
              </h1>
              <h2
                className="text-xl text-muted-foreground mb-4"
                data-testid="text-poll-title"
              >
                {poll.title}
              </h2>
              {poll.description && (
                <p
                  className="text-muted-foreground mb-4"
                  data-testid="text-poll-description"
                >
                  {poll.description}
                </p>
              )}

              <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span
                    className="number-counter text-lg font-semibold text-foreground"
                    data-testid="text-total-votes"
                  >
                    {totalVotes}
                  </span>{" "}
                  total votes
                </span>
                {poll.unique_voters > 0 && (
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-2 opacity-50" />
                    <span className="number-counter text-lg font-semibold text-foreground">
                      {poll.unique_voters}
                    </span>{" "}
                    unique voters
                  </span>
                )}
                <span className="flex items-center">
                  {poll.is_active ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 pulse-subtle"></div>
                      Live results
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                      Poll ended
                    </>
                  )}
                </span>
                {poll.creator && <span>by {poll.creator.name}</span>}
              </div>
            </div>

            {/* Animated Results Chart */}
            <div className="space-y-8 mb-8">
              {sortedResults.map((result, displayIndex) => (
                <div
                  key={result.optionId}
                  className="fade-in-up"
                  style={{ animationDelay: `${displayIndex * 0.15}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: colors[displayIndex % colors.length],
                        }}
                      ></div>
                      <span
                        className="font-semibold text-lg text-foreground"
                        data-testid={`text-option-${result.optionId}`}
                      >
                        {result.option}
                      </span>
                      {displayIndex === 0 && result.count > 0 && (
                        <div className="bg-gradient-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                          Leading
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span
                        className="number-counter text-sm text-muted-foreground"
                        data-testid={`text-votes-${result.optionId}`}
                      >
                        {result.count} {result.count === 1 ? "vote" : "votes"}
                      </span>
                      <span
                        className="font-bold text-2xl text-foreground number-counter"
                        data-testid={`text-percentage-${result.optionId}`}
                      >
                        {result.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className="relative">
                    <div className="results-bar">
                      <div
                        className="results-bar-fill"
                        style={{
                          width: `${result.percentage}%`,
                          backgroundColor: colors[displayIndex % colors.length],
                          background: `linear-gradient(90deg, ${
                            colors[displayIndex % colors.length]
                          } 0%, ${
                            colors[displayIndex % colors.length]
                          }dd 70%, ${
                            colors[displayIndex % colors.length]
                          }aa 100%)`,
                        }}
                      ></div>
                    </div>
                    {/* Percentage indicator */}
                    {result.percentage > 0 && (
                      <div
                        className="absolute top-0 h-4 flex items-center transition-all duration-1000 ease-out"
                        style={{
                          left: `${Math.max(result.percentage - 5, 2)}%`,
                        }}
                      >
                        <div className="text-white text-xs font-bold bg-black bg-opacity-20 rounded px-1">
                          {result.percentage.toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vote milestone celebration */}
                  {result.count >= 10 && result.count % 10 === 0 && (
                    <div className="mt-2 flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                      <span className="text-amber-600 font-medium">
                        Milestone: {result.count} votes!
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalVotes === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg mb-8">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No votes yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to vote on this poll!
                </p>
                <Button
                  onClick={() => router.push(`/poll/${id}`)}
                  data-testid="button-vote"
                >
                  Cast Your Vote
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-border">
              <Button
                onClick={shareResults}
                className="spring-animation touch-target"
                data-testid="button-share"
              >
                <Share className="w-4 h-4 mr-2" />
                Share Results
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowQRModal(true)}
                className="spring-animation touch-target"
                data-testid="button-qr"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Show QR Code
              </Button>
              <Button
                variant="secondary"
                onClick={exportData}
                className="spring-animation touch-target"
                data-testid="button-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="secondary"
                onClick={copyLink}
                className="spring-animation touch-target"
                data-testid="button-copy"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>

            {poll.is_active && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/poll/${id}`)}
                  data-testid="button-vote-again"
                >
                  Vote on This Poll
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showQRModal && (
        <QRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          pollId={id! as string}
          pollTitle={poll.title}
        />
      )}
    </div>
  );
}
