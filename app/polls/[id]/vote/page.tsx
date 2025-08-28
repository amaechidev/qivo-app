'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Mock poll data
const MOCK_POLL = {
  id: '1',
  title: 'Favorite Programming Language',
  description: 'Vote for your favorite programming language',
  options: [
    { id: '1', text: 'JavaScript' },
    { id: '2', text: 'Python' },
    { id: '3', text: 'TypeScript' },
    { id: '4', text: 'Java' },
    { id: '5', text: 'C#' },
  ]
};

export default function VotePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [poll, setPoll] = useState(MOCK_POLL);
  const [selectedOption, setSelectedOption] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [params.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) return;
    
    // Submit vote logic would go here
    console.log('Submitting vote:', { pollId: params.id, optionId: selectedOption });
    
    // Redirect to results page
    router.push(`/polls/${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-pulse">Loading poll...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/polls/${params.id}`} className="text-indigo-600 hover:text-indigo-800">
          ← Back to Poll Results
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{poll.title}</h1>
          {poll.description && (
            <p className="text-gray-600">{poll.description}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Select an option:</h2>
            {poll.options.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  id={`option-${option.id}`}
                  name="poll-option"
                  type="radio"
                  value={option.id}
                  checked={selectedOption === option.id}
                  onChange={() => setSelectedOption(option.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor={`option-${option.id}`} className="ml-3 block text-gray-700">
                  {option.text}
                </label>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={!selectedOption}
            className={`w-full py-2 px-4 rounded-md ${
              selectedOption
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit Vote
          </button>
        </form>
      </div>
    </div>
  );
}