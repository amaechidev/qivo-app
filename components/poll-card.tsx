"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  MoreVertical,
  Share,
  QrCode,
  BarChart3,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import QRModal from "./qr-modal";
import { useAuth } from "@/lib/context/AuthContext";
import { Poll, PollOption, Vote } from "@/types";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface PollCardProps {
  poll: Poll;
}

export default function PollCard({ poll }: PollCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showQRModal, setShowQRModal] = useState(false);

  // Fetch poll options using Supabase
  const {
    data: pollOptions = [],
    error: pollOptionsError,
    isLoading: pollOptionsLoading,
  } = useQuery({
    queryKey: ["poll-options", poll.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", poll.id)
        .order("option_order");

      if (error) {
        throw error;
      }

      return data as PollOption[];
    },
    retry: 2,
    retryDelay: 1000,
  });

  const {
    data: votes = [],
    error: votesError,
    isLoading: votesLoading,
  } = useQuery({
    queryKey: ["votes", poll.id],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("*")
        .eq("poll_id", poll.id);

      if (error) {
        throw error;
      }

      return data as Vote[];
    },
    retry: 2,
    retryDelay: 1000,
  });

  const deletePollMutation = useMutation({
    mutationFn: async () => {
      // Delete votes first
      const { error: votesError } = await supabase
        .from("votes")
        .delete()
        .eq("poll_id", poll.id);

      if (votesError) {
        throw new Error(`Failed to delete votes: ${votesError.message}`);
      }

      // Delete poll options
      const { error: optionsError } = await supabase
        .from("poll_options")
        .delete()
        .eq("poll_id", poll.id);

      if (optionsError) {
        throw new Error(
          `Failed to delete poll options: ${optionsError.message}`
        );
      }

      // Then delete the poll itself
      const { error: pollError } = await supabase
        .from("polls")
        .delete()
        .eq("id", poll.id)
        .eq("creator_id", user?.id); // Ensure user can only delete their own polls

      if (pollError) {
        throw new Error(`Failed to delete poll: ${pollError.message}`);
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate and refetch polls
      queryClient.invalidateQueries({
        queryKey: ["polls", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-polls", user?.id],
      });
      // Also remove this specific poll from cache
      queryClient.removeQueries({
        queryKey: ["poll", poll.id],
      });
      queryClient.removeQueries({
        queryKey: ["votes", poll.id],
      });
      queryClient.removeQueries({
        queryKey: ["poll-options", poll.id],
      });

      toast({
        title: "Success",
        description: "Poll deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete poll error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete poll",
        variant: "destructive",
      });
    },
  });

  // Toggle poll active status using Supabase
  const togglePollStatusMutation = useMutation({
    mutationFn: async (newStatus: boolean) => {
      const { data, error } = await supabase
        .from("polls")
        .update({ is_active: newStatus })
        .eq("id", poll.id)
        .eq("creator_id", user?.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update poll status: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      // Update the poll in cache
      queryClient.invalidateQueries({
        queryKey: ["polls", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["poll", poll.id],
      });

      toast({
        title: "Success",
        description: `Poll ${
          data.is_active ? "activated" : "deactivated"
        } successfully`,
      });
    },
    onError: (error) => {
      console.error("Toggle poll status error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update poll status",
        variant: "destructive",
      });
    },
  });

  const copyLink = async () => {
    const link = `${window.location.origin}/polls/${poll.id}`;
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
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  // Create vote counts from fetched votes data
  const getVoteData = () => {
    if (
      !votes ||
      votes.length === 0 ||
      !pollOptions ||
      pollOptions.length === 0
    ) {
      return { voteCounts: {}, totalVotes: 0, optionData: [] };
    }
    const voteCounts: { [key: string]: number } = {};

    // Initialize vote counts for all options
    pollOptions.forEach((option) => {
      voteCounts[option.id] = 0;
    });

    // Count votes for each option using poll_option_id
    votes.forEach((vote: Vote) => {
      if (
        vote.poll_option_id &&
        voteCounts.hasOwnProperty(vote.poll_option_id)
      ) {
        voteCounts[vote.poll_option_id]++;
      }
    });

    const totalVotes = votes.length;

    // Create option data with vote counts and percentages
    const optionData = pollOptions.map((option) => ({
      ...option,
      votes: voteCounts[option.id] || 0,
      percentage:
        totalVotes > 0 ? ((voteCounts[option.id] || 0) / totalVotes) * 100 : 0,
    }));

    return { voteCounts, totalVotes, optionData };
  };

  const getTopOption = () => {
    const { optionData, totalVotes } = getVoteData();

    if (totalVotes === 0 || !optionData.length) return null;

    // Find the option with the most votes
    const topOption = optionData.reduce((prev, current) =>
      prev.votes > current.votes ? prev : current
    );

    return {
      option: topOption.option_text,
      percentage: topOption.percentage,
      votes: topOption.votes,
    };
  };

  const topOption = getTopOption();
  const { totalVotes } = getVoteData();
  const isActive = poll.is_active;

  const getDaysAgo = () => {
    try {
      const createdDate = new Date(poll.created_at);
      const now = new Date();
      const diffTime = now.getTime() - createdDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "1 day ago";
      return `${diffDays} days ago`;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return "Unknown";
    }
  };

  const timeText = getDaysAgo();

  // Show loading state
  if (votesLoading || pollOptionsLoading) {
    return (
      <Card className="shadow-sm border border-border card-hover overflow-hidden opacity-75">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-2 bg-muted rounded w-full mb-4"></div>
            <div className="flex justify-between">
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-muted rounded"></div>
                <div className="w-8 h-8 bg-muted rounded"></div>
                <div className="w-8 h-8 bg-muted rounded"></div>
              </div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (votesError) {
    console.error("Error fetching votes:", votesError);
  }

  if (pollOptionsError) {
    console.error("Error fetching poll options:", pollOptionsError);
  }

  return (
    <>
      <Card
        className={`shadow-sm border border-border card-hover overflow-hidden cursor-pointer ${
          !isActive ? "opacity-75" : ""
        }`}
        onClick={() => router.push(`/polls/${poll.id}/results`)}
        data-testid={`card-poll-${poll.id}`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3
                  className="font-semibold text-foreground line-clamp-2 mr-2"
                  data-testid={`text-title-${poll.id}`}
                >
                  {poll.title}
                </h3>
                {totalVotes > 50 && isActive && (
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    Trending
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  <span
                    className="number-counter"
                    data-testid={`text-votes-${poll.id}`}
                  >
                    {totalVotes}
                  </span>{" "}
                  {totalVotes === 1 ? "vote" : "votes"}
                </span>
                <span className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-1 ${
                      isActive ? "bg-green-500 pulse-subtle" : "bg-gray-400"
                    }`}
                  ></div>
                  {isActive ? "Active" : "Ended"}
                </span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`button-menu-${poll.id}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/polls/${poll.id}/results`);
                  }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Results
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePollStatusMutation.mutate(!isActive);
                  }}
                  disabled={togglePollStatusMutation.isPending}
                >
                  <div
                    className={`w-4 h-4 mr-2 rounded-full ${
                      isActive ? "bg-gray-400" : "bg-green-500"
                    }`}
                  />
                  {togglePollStatusMutation.isPending
                    ? "Updating..."
                    : isActive
                    ? "End Poll"
                    : "Activate Poll"}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    copyLink();
                  }}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQRModal(true);
                  }}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Show QR Code
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm(
                        "Are you sure you want to delete this poll? This action cannot be undone."
                      )
                    ) {
                      deletePollMutation.mutate();
                    }
                  }}
                  disabled={deletePollMutation.isPending}
                >
                  {deletePollMutation.isPending ? "Deleting..." : "Delete Poll"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mini Progress Preview */}
          {topOption && totalVotes > 0 && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs">
                <span
                  className="text-muted-foreground truncate max-w-[70%]"
                  data-testid={`text-top-option-${poll.id}`}
                  title={topOption.option}
                >
                  {topOption.option}
                </span>
                <span
                  className="text-muted-foreground number-counter"
                  data-testid={`text-top-percentage-${poll.id}`}
                >
                  {topOption.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full progress-bar transition-all duration-300 ease-in-out"
                  style={{ width: `${Math.max(topOption.percentage, 0)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Show message when no votes */}
          {totalVotes === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No votes yet
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  copyLink();
                }}
                title="Share"
                aria-label="Share poll"
              >
                <Share className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQRModal(true);
                }}
                title="QR Code"
                aria-label="Show QR Code"
              >
                <QrCode className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/polls/${poll.id}/results`);
                }}
                title="Analytics"
                aria-label="View analytics"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
            <span className="text-xs text-muted-foreground flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {timeText}
            </span>
          </div>
        </CardContent>
      </Card>

      {showQRModal && (
        <QRModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          pollId={poll.id}
          pollTitle={poll.title}
        />
      )}
    </>
  );
}
