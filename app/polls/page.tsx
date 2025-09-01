"use client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Calendar,
  User,
  Filter,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Poll, Creator } from "@/types";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface PollWithCreator extends Poll {
  profiles?: Creator;
}

type SortOption = "newest" | "oldest" | "most_votes" | "least_votes";

export default function PublicPolls() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Fetch all public polls with creator information
  const {
    data: polls = [],
    isLoading,
    error,
  } = useQuery<PollWithCreator[]>({
    queryKey: ["public-polls", sortBy],
    queryFn: async () => {
      let query = supabase
        .from("polls")
        .select(
          `
          *,
          profiles!fk_creator_id(id, name, full_name, name, email)
        `
        )
        .eq("is_public", true);

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "most_votes":
          query = query.order("total_votes", { ascending: false });
          break;
        case "least_votes":
          query = query.order("total_votes", { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as PollWithCreator[];
    },
  });

  const handlePollClick = (pollId: string) => {
    router.push(`/poll/${pollId}`);
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "newest":
        return "Newest First";
      case "oldest":
        return "Oldest First";
      case "most_votes":
        return "Most Votes";
      case "least_votes":
        return "Least Votes";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCreatorDisplay = (poll: PollWithCreator) => {
    if (poll.profiles) {
      return (
        poll.profiles.full_name ||
        poll.profiles.name ||
        poll.profiles.email ||
        "Unknown"
      );
    }
    return "Unknown";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading polls...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">
              Error Loading Polls
            </h1>
            <p className="text-muted-foreground mb-6">
              Something went wrong while loading the polls. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="text-primary-foreground text-lg" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Public Polls
          </h1>
          <p className="text-muted-foreground">
            Discover and participate in community polls
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Sort by:
            </span>
          </div>
          <div className="flex space-x-2">
            {(
              ["newest", "oldest", "most_votes", "least_votes"] as SortOption[]
            ).map((option) => (
              <Button
                key={option}
                variant={sortBy === option ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy(option)}
                className="text-xs"
              >
                {getSortLabel(option)}
              </Button>
            ))}
          </div>
        </div>

        {/* Polls Grid */}
        {polls.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No Public Polls Found
            </h2>
            <p className="text-muted-foreground">
              Be the first to create a public poll!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map((poll) => (
              <Card
                key={poll.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-border"
                onClick={() => handlePollClick(poll.id)}
              >
                <CardContent className="p-6">
                  {/* Poll Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        poll.is_active
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {poll.is_active ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Ended
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(poll.created_at)}
                    </div>
                  </div>

                  {/* Poll Title */}
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 min-h-[3.5rem]">
                    {poll.title}
                  </h3>

                  {/* Poll Description */}
                  {poll.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 min-h-[4rem]">
                      {poll.description}
                    </p>
                  )}

                  {/* Poll Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        Votes
                      </span>
                      <span className="font-semibold text-foreground">
                        {poll.total_votes || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <User className="w-4 h-4 mr-2" />
                        Creator
                      </span>
                      <span className="font-medium text-foreground truncate max-w-[120px]">
                        {getCreatorDisplay(poll)}
                      </span>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {poll.is_active ? "Click to vote" : "View results"}
                      </span>
                      <div className="text-primary">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {polls.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-6 text-sm text-muted-foreground bg-muted/50 rounded-lg px-6 py-3">
              <span className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                {polls.length} polls
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {polls.reduce(
                  (sum, poll) => sum + (poll.total_votes || 0),
                  0
                )}{" "}
                total votes
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                {polls.filter((poll) => poll.is_active).length} active
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
