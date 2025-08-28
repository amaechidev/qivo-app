'use client';

import Link from 'next/link';
import { useState } from 'react';

// Mock data for polls
const MOCK_POLLS = [
  { id: '1', title: 'Favorite Programming Language', votes: 120, created: '2023-05-15' },
  { id: '2', title: 'Best Frontend Framework', votes: 85, created: '2023-05-20' },
  { id: '3', title: 'Most Important Developer Skill', votes: 64, created: '2023-05-25' },
  { id: '4', title: 'Preferred Database', votes: 42, created: '2023-06-01' },
];

export default function PollsPage() {
  const [polls, setPolls] = useState(MOCK_POLLS);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Available Polls</h1>
        <Link 
          href="/polls/create" 
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-500 transition-colors"
        >
          Create New Poll
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {polls.map((poll) => (
          <div 
            key={poll.id} 
            className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{poll.title}</h2>
            <div className="text-sm text-gray-500 mb-4">
              <p>{poll.votes} votes • Created {poll.created}</p>
            </div>
            <div className="flex justify-between">
              <Link 
                href={`/polls/${poll.id}`}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View Results
              </Link>
              <Link 
                href={`/polls/${poll.id}/vote`}
                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-200"
              >
                Vote Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}