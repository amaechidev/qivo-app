'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock poll data
const MOCK_POLL = {
  id: '1',
  title: 'Favorite Programming Language',
  description: 'Vote for your favorite programming language',
  created: '2023-05-15',
  totalVotes: 120,
  options: [
    { id: '1', text: 'JavaScript', votes: 45 },
    { id: '2', text: 'Python', votes: 35 },
    { id: '3', text: 'TypeScript', votes: 25 },
    { id: '4', text: 'Java', votes: 10 },
    { id: '5', text: 'C#', votes: 5 },
  ]
};

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const [poll, setPoll] = useState(MOCK_POLL);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-pulse">Loading poll results...</div>
      </div>
    );
  }

  // Calculate percentages for the chart
  const calculatePercentage = (votes: number) => {
    return Math.round((votes / poll.totalVotes) * 100) || 0;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/polls" className="text-indigo-600 hover:text-indigo-800">
          ← Back to Polls
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{poll.title}</h1>
          {poll.description && (
            <p className="text-gray-600">{poll.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Created on {poll.created} • {poll.totalVotes} total votes
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Results</h2>
          {poll.options.map((option) => {
            const percentage = calculatePercentage(option.votes);
            return (
              <div key={option.id} className="space-y-1">
                <div className="flex justify-between">
                  <span>{option.text}</span>
                  <span className="font-medium">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">{option.votes} votes</p>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between">
          <Link
            href={`/polls/${params.id}/vote`}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Vote in this Poll
          </Link>
          <button
            className="text-gray-600 hover:text-gray-800"
            onClick={() => {
              // Share functionality would go here
              alert('Share functionality will be implemented here');
            }}
          >
            Share Poll
          </button>
        </div>
      </div>
    </div>
  );
}