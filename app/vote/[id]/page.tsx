"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { BarChart3, Users, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Poll } from "../../dashboard/page";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/context/AuthContext";

export default function Vote() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasVoted, setHasVoted] = useState(false);

  const { user } = useAuth();
  const user_id = user ? user.id : "anonymous";
  // const {
  //   data: poll,
  //   isLoading,
  //   error,
  // } = useQuery({
  //   queryKey: ["/api/polls", id],
  //   enabled: !!id,
  // });

  const {
    data: poll,
    isLoading,
    error,
  } = useQuery<Poll>({
    queryKey: ["polls"],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("poll_id", id)
        .single();

      if (error) {
        throw error;
      }
      return data as Poll;
    },
    enabled: !!id, // Only enable the query if id is available
  });

  const voteMutation = useMutation({
    mutationFn: async (optionIndex: number) => {
      const { data, error } = await supabase
        .from("polls")
        .insert([{ user_id, optionIndex, id }])
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["poll_results", id]);
      setHasVoted(true);
      toast({
        title: "Vote Cast!",
        description: "Thank you for participating in this poll.",
      });
      // Redirect to results after a short delay
      setTimeout(() => {
        setLocation(`/poll/${id}/results`);
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to cast vote",
        variant: "destructive",
      });
    },
  });

  const handleVote = (optionIndex: number) => {
    if (hasVoted || voteMutation.isPending) return;
    voteMutation.mutate(optionIndex);
  };

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

  if (error || !poll) {
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
            <Button onClick={() => setLocation("/")} data-testid="button-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll.isActive) {
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
              onClick={() => setLocation(`/poll/${id}/results`)}
              data-testid="button-results"
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
              {poll.options.map((option: string, index: number) => (
                <div
                  key={index}
                  className={`poll-option ${
                    voteMutation.isPending
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  onClick={() => handleVote(index)}
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
                          {option}
                        </span>
                        <div className="text-sm text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Click to vote for this option
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        {String.fromCharCode(65 + index)}
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
                    {poll.voteCount}
                  </span>{" "}
                  votes
                </span>
                <span>Created by {poll.creator.name}</span>
                <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
