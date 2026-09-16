'use client';

import { Trophy, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Tournament } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface TournamentCardProps {
  tournament: Tournament;
  onClick?: () => void;
}

export default function TournamentCard({ tournament, onClick }: TournamentCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition cursor-pointer"
    >
      {/* Image or Gradient */}
      {tournament.image ? (
        <div className="h-48 overflow-hidden">
          <img 
            src={tournament.image} 
            alt={tournament.name} 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
          <Trophy className="w-16 h-16 text-white opacity-60" />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {tournament.name}
        </h3>

        {/* Location */}
        {tournament.location && (
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm truncate">{tournament.location}</span>
          </div>
        )}

        {/* City, State */}
        {(tournament.city || tournament.state) && (
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <span className="text-sm">
              {tournament.city}{tournament.city && tournament.state ? ', ' : ''}{tournament.state}
            </span>
          </div>
        )}

        {/* Date */}
        {tournament.startDate && (
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-sm">{tournament.startDate}</span>
          </div>
        )}

        {/* Entry Fee */}
        {tournament.entryFee && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600">Entry Fee</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(tournament.entryFee)}
            </span>
          </div>
        )}

        {/* Species Badge */}
        {tournament.species && (
          <div className="mt-3">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
              {tournament.species}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
