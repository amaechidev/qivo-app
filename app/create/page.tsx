"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CreatePoll() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [requireAuth, setRequireAuth] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const createPollMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      options: string[];
      isPublic: boolean;
      requireAuth: boolean;
      expiresAt?: string;
    }) => {
      // Generate a slug from title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);

      // Create the poll first
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({
          title: data.title,
          description: data.description,
          slug: slug,
          creator_id: user?.id,
          is_active: true,
          is_public: data.isPublic,
          require_auth: data.requireAuth,
          options: [], // Empty array as we'll store options separately
          vote_count: 0,
          total_votes: 0,
          unique_voters: 0,
          expires_at:
            data.expiresAt ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
        })
        .select()
        .single();

      if (pollError) throw new Error(pollError.message);

      // Create poll options
      const pollOptionsData = data.options.map((option, index) => ({
        poll_id: poll.id,
        option_text: option,
        option_order: index,
        vote_count: 0,
      }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(pollOptionsData);

      if (optionsError) {
        // If options creation fails, delete the poll
        await supabase.from("polls").delete().eq("id", poll.id);
        throw new Error(
          `Failed to create poll options: ${optionsError.message}`
        );
      }

      return poll;
    },
    onSuccess: (poll) => {
      queryClient.invalidateQueries({
        queryKey: ["polls", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-polls", user?.id],
      });
      toast({
        title: "Success",
        description: "Poll created successfully!",
      });
      router.push(`/poll/${poll.id}/results`);
    },
    onError: (error) => {
      console.error("Create poll error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create poll",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validOptions = options.filter((option) => option.trim() !== "");

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a poll question",
        variant: "destructive",
      });
      return;
    }

    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please add at least 2 options",
        variant: "destructive",
      });
      return;
    }

    if (validOptions.length > 10) {
      toast({
        title: "Error",
        description: "Maximum 10 options allowed",
        variant: "destructive",
      });
      return;
    }

    // Validate expiry date if provided
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      const now = new Date();
      if (expiryDate <= now) {
        toast({
          title: "Error",
          description: "Expiry date must be in the future",
          variant: "destructive",
        });
        return;
      }
    }

    createPollMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      options: validOptions,
      isPublic,
      requireAuth,
      expiresAt: expiresAt || undefined,
    });
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, etc.
  };

  // Format date for input (YYYY-MM-DDTHH:MM)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (!user) {
    router.push("/auth");
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="shadow-sm border border-border overflow-hidden">
        <CardHeader className="border-b border-border pb-2">
          <CardTitle className="text-2xl font-bold text-foreground">
            Create New Poll
          </CardTitle>
          <p className="text-muted-foreground">
            Design your poll and watch it come to life
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid-cols-1 md:grid-cols-2 gap-0 border-red-700">
            {/* Creation Form */}
            <div className="p-6 border-r border-border flex justify-center">
              <form onSubmit={handleSubmit} className="space-y-6 w-full">
                <div>
                  <Label
                    htmlFor="title"
                    className="block text-sm font-medium text-foreground mb-3"
                  >
                    Poll Question
                  </Label>
                  <Textarea
                    id="title"
                    placeholder="What would you like to ask?"
                    className="w-full bg-background border border-border rounded-lg p-4 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-question"
                    maxLength={200}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {title.length}/200 characters
                  </div>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-foreground mb-3">
                    Answer Options
                  </Label>
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Label
                          htmlFor={`option-${index}`}
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground"
                        >
                          {getOptionLabel(index)}
                        </Label>
                        <Input
                          id={`option-${index}`}
                          type="text"
                          placeholder={`Option ${getOptionLabel(index)}`}
                          className="flex-1 bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          data-testid={`input-option-${index}`}
                          maxLength={100}
                        />
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive transition-colors touch-target"
                            onClick={() => removeOption(index)}
                            data-testid={`button-remove-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {options.length < 10 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors font-medium"
                        onClick={addOption}
                        data-testid="button-add-option"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Option ({options.length}/10)</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progressive Disclosure - Advanced Settings */}
                <Collapsible
                  open={isAdvancedOpen}
                  onOpenChange={setIsAdvancedOpen}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex items-center justify-between w-full text-left border-t border-border pt-6"
                      data-testid="button-advanced"
                    >
                      <span className="text-sm font-medium text-foreground">
                        Advanced Settings
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          isAdvancedOpen ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        Description (Optional)
                      </Label>
                      <Textarea
                        placeholder="Add more context to your poll..."
                        className="w-full bg-background border border-border rounded-lg p-4 h-16 resize-none focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        data-testid="input-description"
                        maxLength={500}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {description.length}/500 characters
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="block text-sm font-medium text-foreground mb-2">
                          Poll Visibility
                        </Label>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="visibility"
                              checked={isPublic}
                              onChange={() => setIsPublic(true)}
                              className="w-4 h-4 text-primary"
                            />
                            <span className="text-sm text-foreground">
                              Public
                            </span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="visibility"
                              checked={!isPublic}
                              onChange={() => setIsPublic(false)}
                              className="w-4 h-4 text-primary"
                            />
                            <span className="text-sm text-foreground">
                              Private
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <Label className="block text-sm font-medium text-foreground mb-2">
                          Voting Requirements
                        </Label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={requireAuth}
                            onChange={(e) => setRequireAuth(e.target.checked)}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-sm text-foreground">
                            Require login to vote
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">
                        Expiry Date (Optional)
                      </Label>
                      <Input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        min={formatDateForInput(new Date())}
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                        data-testid="input-expires-at"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Leave empty for no expiry (default: 30 days)
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 spring-animation touch-target"
                    disabled={createPollMutation.isPending}
                    data-testid="button-create"
                  >
                    {createPollMutation.isPending
                      ? "Creating..."
                      : "Create Poll"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="px-6 py-3 spring-animation touch-target"
                    onClick={() => router.push("/dashboard")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>

            {/* Live Preview */}
            <div className="p-2 pt-6 md:p-6 bg-background">
              <div className="sticky top-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Live Preview
                  </h3>
                </div>

                {/* Enhanced Live Preview */}
                <div className="glass-effect rounded-2xl border border-border/50 backdrop-blur-sm">
                  <Card className="shadow-lg border border-border/50 overflow-hidden p-0">
                    <CardContent className="py-8 px-5 md:p-8">
                      {/* Poll Header */}
                      <div className="text-center mb-8">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <span className="text-primary-foreground text-lg">
                            📊
                          </span>
                        </div>
                        <h4
                          className="text-xl font-bold text-foreground mb-3 transition-all duration-300"
                          data-testid="text-preview-question"
                        >
                          {title || "Your poll question will appear here..."}
                        </h4>
                        {description && (
                          <p
                            className="text-muted-foreground fade-in"
                            data-testid="text-preview-description"
                          >
                            {description}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Choose one option below
                        </p>

                        {/* Preview settings */}
                        <div className="flex justify-center space-x-4 mt-4 text-xs">
                          <span
                            className={`px-2 py-1 rounded-full ${
                              isPublic
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {isPublic ? "Public" : "Private"}
                          </span>
                          {requireAuth && (
                            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                              Login Required
                            </span>
                          )}
                          {expiresAt && (
                            <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                              Expires:{" "}
                              {new Date(expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Interactive Preview Options */}
                      <div className="space-y-4">
                        {options.map((option, index) => (
                          <div
                            key={index}
                            className="poll-option opacity-80 hover:opacity-100 transition-opacity duration-300"
                            data-testid={`button-preview-option-${index}`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <div className="w-5 h-5 border-2 border-muted-foreground rounded-full transition-all duration-300"></div>
                                  <div className="absolute inset-0 w-5 h-5 rounded-full bg-primary opacity-0 scale-50 transition-all duration-300"></div>
                                </div>
                                <div className="flex-1">
                                  <span className="text-lg font-medium text-foreground transition-colors">
                                    {option ||
                                      `Option ${getOptionLabel(index)}`}
                                  </span>
                                  <div className="text-sm text-muted-foreground mt-1 opacity-70">
                                    {option
                                      ? "Ready to vote"
                                      : "Add text for this option"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                                  {getOptionLabel(index)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Preview Footer */}
                      <div className="mt-8 pt-6 border-t border-border">
                        <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <div className="w-4 h-4 mr-2 text-green-500">
                              👥
                            </div>
                            <span className="number-counter mr-1">0</span>
                            <span>votes</span>
                          </span>
                          <span className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            Active
                          </span>
                          <span>
                            by {user.user_metadata?.name || user.email || "You"}
                          </span>
                        </div>
                        <div className="text-center mt-4">
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1 inline-block">
                            ✨ This is how your poll will look
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
