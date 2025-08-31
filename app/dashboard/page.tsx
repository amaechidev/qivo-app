"use client";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, BarChart3 } from "lucide-react";
import PollCard from "@/components/poll-card";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Poll } from "@/types";

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth");
    }
  }, [user, isAuthLoading, router]);

  const { data: polls, isLoading: isPollsLoading } = useQuery<Poll[]>({
    queryKey: ["userPolls", user?.id], // A simpler queryKey when fetching directly from Supabase
    queryFn: async () => {
      if (!user?.id) return []; // If no user, return empty array

      const { data, error } = await supabase
        .from("polls") // Assuming your table name is 'polls'
        .select("*")
        .eq("creator_id", user.id) // Fetch polls specific to the logged-in user
        .order("created_at", { ascending: false }); // Example ordering

      if (error) {
        throw error;
      }
      return data as Poll[]; // Cast to Poll[] for type safety
    },
    enabled: !!user?.id, // Only enable the query if user.id is available
  });

  const filteredPolls =
    polls?.filter(
      (poll: Poll) =>
        poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poll.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  if (isAuthLoading || !user) {
    // router.push("/auth");
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ">
        <div className="flex flex-col ">
          <h1 className="text-3xl font-bold text-foreground">Your Polls</h1>
          <p className="text-muted-foreground">
            Manage and track your poll performance
          </p>
        </div>
        <div className="flex  items-center space-x-3 ">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="search"
              placeholder="Search polls..."
              className="pl-10 pr-4 py-2 w-full md:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>
        {/* <Button
          onClick={() => router.push("/create")}
          className="md:hidden spring-animation touch-target w-32 self-end md:self-start"
          data-testid="button-create"
        >
          <Plus className="w-4 h-4 " />
          Create Poll
        </Button> */}
      </div>

      {isPollsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-muted rounded mb-2"></div>
                <div className="h-2 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPolls.map((poll: Poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}

          {/* Create New Poll Card */}
          <Card
            className="border-2 border-dashed border-border card-hover overflow-hidden flex items-center justify-center min-h-[200px] cursor-pointer"
            onClick={() => router.push("/create")}
            data-testid="card-create-new"
          >
            <CardContent className="text-center p-6">
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                <Plus className="text-muted-foreground text-lg" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                Create New Poll
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Start gathering opinions instantly
              </p>
              <Button className="spring-animation">Get Started</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!isPollsLoading && filteredPolls.length === 0 && searchQuery && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No polls found
          </h3>
          <p className="text-muted-foreground">
            Try searching with different keywords or create a new poll.
          </p>
        </div>
      )}

      {!isPollsLoading && filteredPolls.length === 0 && !searchQuery && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No polls yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first poll to start gathering opinions.
          </p>
          <Button
            onClick={() => router.push("/create")}
            className="spring-animation"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Poll
          </Button>
        </div>
      )}
    </div>
  );
}
