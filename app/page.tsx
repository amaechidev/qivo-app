import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Create and Share Polls with{" "}
          <span className="text-indigo-600">Qivo</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          The easiest way to create polls, gather opinions, and analyze results
          in real-time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <Link
            href="/polls"
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors text-lg font-medium"
          >
            Browse Polls
          </Link>
          <Link
            href="/create"
            className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-md hover:bg-indigo-50 transition-colors text-lg font-medium"
          >
            Create a Poll
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 w-full mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Image src="/file.svg" alt="Create icon" width={24} height={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Create</h3>
            <p className="text-gray-600">
              Create custom polls with multiple options in seconds. Add
              descriptions and set end dates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Image src="/globe.svg" alt="Share icon" width={24} height={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Share</h3>
            <p className="text-gray-600">
              Share your polls with friends, colleagues, or the world. Get
              responses quickly.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="bg-indigo-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Image
                src="/window.svg"
                alt="Analyze icon"
                width={24}
                height={24}
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analyze</h3>
            <p className="text-gray-600">
              View real-time results with beautiful visualizations. Export data
              for deeper analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
