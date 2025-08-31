"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Users,
  Clock,
  Share2,
} from "lucide-react";

interface DemoPollOption {
  id: string;
  text: string;
  votes: number;
  color: string;
}

export default function Home() {
  const [hasVoted, setHasVoted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [demoPollOptions, setDemoPollOptions] = useState<DemoPollOption[]>([
    {
      id: "1",
      text: "Early Morning (5-9 AM)",
      votes: 45,
      color: "from-purple-400 to-pink-500",
    },
    {
      id: "2",
      text: "Late Evening (8-11 PM)",
      votes: 32,
      color: "from-cyan-400 to-blue-500",
    },
    {
      id: "3",
      text: "Afternoon (1-5 PM)",
      votes: 23,
      color: "from-green-400 to-emerald-500",
    },
  ]);

  useEffect(() => {
    setIsVisible(true);

    // Auto-demo voting
    const autoVoteInterval = setInterval(() => {
      if (hasVoted) return;

      setDemoPollOptions((prev) => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        return prev.map((option, index) =>
          index === randomIndex
            ? { ...option, votes: option.votes + 1 }
            : option
        );
      });
    }, 5000);

    return () => clearInterval(autoVoteInterval);
  }, [hasVoted]);

  const handleDemoVote = (optionId: string) => {
    if (hasVoted) return;

    setHasVoted(true);
    setDemoPollOptions((prev) =>
      prev.map((option) =>
        option.id === optionId ? { ...option, votes: option.votes + 1 } : option
      )
    );

    setTimeout(() => {
      setHasVoted(false);
    }, 3000);
  };

  const totalVotes = demoPollOptions.reduce(
    (sum, option) => sum + option.votes,
    0
  );
  const getPercentage = (votes: number) =>
    Math.round((votes / totalVotes) * 100);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div
          className="absolute top-40 right-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute -bottom-32 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ animationDelay: "4s" }}
        />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div
            className={`transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Qivo
              </span>
              <br />
              <span className="text-white">Polls Reimagined</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Create stunning polls, gather real-time insights, and engage your
              audience like never before.
              <span className="text-cyan-400 font-semibold">
                The future of polling is here.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link href="/create">
                <Button
                  size="lg"
                  className="group relative bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-cyan-600 hover:via-purple-600 hover:to-indigo-600 px-8 py-6 text-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <span className="relative z-10">Create Your First Poll</span>
                </Button>
              </Link>

              <Link href="/polls">
                <Button
                  variant="outline"
                  size="lg"
                  className="group border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 px-8 py-6 text-lg font-bold text-white transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center">
                    Browse Polls
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Demo Poll */}
          <Card
            className={`bg-white/10 backdrop-blur-sm border-white/20 max-w-2xl mx-auto transition-all duration-1000 ${
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            style={{ transitionDelay: "0.5s" }}
          >
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">
                  What's the best time to be productive?
                </h3>
                <p className="text-gray-400">
                  Click an option to see live results!
                </p>
              </div>

              <div className="space-y-4">
                {demoPollOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-all duration-300 group ${
                      hasVoted
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-102"
                    }`}
                    onClick={() => handleDemoVote(option.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-6 h-6 border-2 border-white/50 rounded-full group-hover:border-purple-400 transition-colors" />
                        <span className="text-white font-medium text-lg">
                          {option.text}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-300 font-bold"
                        >
                          {option.votes}
                        </Badge>
                        <div className="w-20 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${option.color} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${getPercentage(option.votes)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {hasVoted && (
                <div className="mt-6 bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center animate-pulse">
                  <p className="text-green-400 font-medium">
                    ✨ Vote recorded! This is how fast Qivo works.
                  </p>
                </div>
              )}

              <p className="text-gray-400 text-sm mt-6 text-center">
                💫 Interactive demo - results update in real-time!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-black relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to create engaging polls and gather meaningful
              insights
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  Lightning Fast
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Create polls in under 30 seconds. Our streamlined interface
                  gets you from idea to published poll instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:animate-pulse">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  Real-time Analytics
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Watch votes pour in live with beautiful charts and instant
                  insights. No refresh needed.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:animate-bounce">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  Duplicate Prevention
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Advanced multi-layer protection ensures fair voting with IP,
                  fingerprint, and user tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-black relative">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Why Choose Qivo?
              </h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4 group">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Instant Setup
                    </h3>
                    <p className="text-gray-400">
                      No registration required for voters. Share a link and
                      start collecting responses immediately.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Fraud Protection
                    </h3>
                    <p className="text-gray-400">
                      Multi-layer duplicate prevention ensures fair and accurate
                      voting results.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Beautiful Analytics
                    </h3>
                    <p className="text-gray-400">
                      Gorgeous real-time charts and exportable data for deeper
                      insights into your results.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Demo Results */}
              <div className="relative">
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 transform rotate-3 hover:rotate-0 transition-transform duration-500 hover:shadow-2xl">
                  <CardContent className="p-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-white font-bold text-lg">
                          Live Poll Results
                        </h4>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                          Live
                        </Badge>
                      </div>
                      <div className="space-y-4">
                        {demoPollOptions.map((option, index) => {
                          const percentage = getPercentage(option.votes);
                          return (
                            <div
                              key={option.id}
                              className="flex justify-between items-center"
                            >
                              <span className="text-white/90 font-medium">
                                Option {String.fromCharCode(65 + index)}
                              </span>
                              <div className="flex items-center space-x-3">
                                <div className="w-32 bg-white/20 rounded-full h-3 overflow-hidden">
                                  <div
                                    className={`bg-gradient-to-r ${option.color} h-full rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-white font-bold min-w-[3rem] text-right">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-center mt-6 space-x-4 text-white/60">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">
                          {totalVotes} total votes
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="absolute -z-10 top-4 left-4 w-full h-full bg-gradient-to-br from-purple-600/50 to-pink-600/50 rounded-3xl blur-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-24 relative bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
                See It In Action
              </h2>
              <p className="text-xl text-gray-300">
                Experience the magic of real-time polling
              </p>
            </div>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-2xl mx-auto hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    What's the best time to be productive?
                  </h3>
                  <p className="text-gray-400">
                    Click an option to see live results!
                  </p>
                </div>

                <div className="space-y-4">
                  {demoPollOptions.map((option, index) => (
                    <div
                      key={option.id}
                      className={`cursor-pointer bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-all duration-300 group ${
                        hasVoted
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:scale-102"
                      }`}
                      onClick={() => handleDemoVote(option.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-6 h-6 border-2 border-white/50 rounded-full group-hover:border-purple-400 transition-colors" />
                          <span className="text-white font-medium text-lg">
                            {option.text}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge
                            className={`bg-gradient-to-r ${option.color} text-white font-bold`}
                          >
                            {option.votes}
                          </Badge>
                          <div className="w-20 bg-gray-700 rounded-full h-2">
                            <div
                              className={`bg-gradient-to-r ${option.color} h-full rounded-full transition-all duration-500`}
                              style={{
                                width: `${getPercentage(option.votes)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-6">
                  <p className="text-gray-400 text-sm">
                    💫 Interactive demo - results update in real-time!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-12 text-white">
              Trusted by Thousands
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  10K+
                </div>
                <p className="text-gray-400 font-medium">Polls Created</p>
              </div>

              <div className="group">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  250K+
                </div>
                <p className="text-gray-400 font-medium">Votes Cast</p>
              </div>

              <div className="group">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  50K+
                </div>
                <p className="text-gray-400 font-medium">Happy Users</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative bg-gradient-to-r from-purple-900 via-indigo-900 to-cyan-900">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black mb-8 text-white">
              Ready to Create Amazing Polls?
            </h2>
            <p className="text-xl text-white/80 mb-12 leading-relaxed">
              Join thousands of users who trust Qivo for their polling needs.
              Start engaging your audience today.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link href="/create">
                <Button
                  size="lg"
                  className="group bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 px-10 py-6 text-xl font-bold text-white transition-all duration-300 hover:scale-105"
                >
                  <span className="flex items-center">
                    Get Started Free
                    <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>

              <Link href="/polls">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 bg-transparent hover:bg-white/10 px-10 py-6 text-xl font-bold text-white transition-all duration-300 hover:scale-105"
                >
                  View Examples
                </Button>
              </Link>
            </div>

            <div className="flex justify-center space-x-8 text-white/60">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Free Forever</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>No Registration Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Real-time Results</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Qivo
            </h3>
            <p className="text-gray-400 mb-6">
              Making polling beautiful, fast, and reliable.
            </p>
            <div className="flex justify-center space-x-6 text-gray-400">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/support"
                className="hover:text-white transition-colors"
              >
                Support
              </Link>
              <Link href="/api" className="hover:text-white transition-colors">
                API
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
