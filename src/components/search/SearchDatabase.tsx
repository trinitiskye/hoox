'use client';

import { useState } from 'react';
import { SearchParams } from '@/types';

interface SearchDatabaseProps {
  onSearch: (params: SearchParams) => void;
}

export default function SearchDatabase({ onSearch }: SearchDatabaseProps) {
  const [searchType, setSearchType] = useState<SearchParams['type']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      alert('Please enter search criteria');
      return;
    }

    onSearch({ type: searchType, query: searchQuery });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 border border-gray-200 lg:sticky lg:top-20">
      <div className="space-y-4">
        {/* Search Type Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search For
          </label>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as SearchParams['type'])}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="clubs">Clubs</option>
            <option value="series">Series</option>
            <option value="tournaments">Tournaments</option>
            <option value="directors">Tournament Directors</option>
            <option value="anglers">Anglers</option>
          </select>
        </div>

        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Criteria
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter search terms..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>
    </div>
  );
}
