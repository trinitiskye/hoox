'use client';

import { Trophy, MapPin, Fish, Users } from 'lucide-react';
import { Tournament, Submission, User } from '@/types';

interface TournamentWinnersProps {
  tournaments: Tournament[];
  submissions: Submission[];
  users: User[];
}

export default function TournamentWinners({ tournaments, submissions, users }: TournamentWinnersProps) {
  // Get completed tournaments
  const now = new Date();
  const completedTournaments = tournaments
    .filter(t => new Date(t.endDate) < now)
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    .slice(0, 6);

  if (completedTournaments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>No tournament winners yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {completedTournaments.map(tournament => {
        // Calculate winner
        const tournamentSubmissions = submissions.filter(
          sub => sub.tournamentId === tournament.id && sub.status === 'approved'
        );

        const anglerTotals: Record<string, { 
          angler: string; 
          totalSize: number; 
          catches: number; 
          submissions: Submission[] 
        }> = {};

        tournamentSubmissions.forEach(sub => {
          if (!anglerTotals[sub.angler]) {
            anglerTotals[sub.angler] = {
              angler: sub.angler,
              totalSize: 0,
              catches: 0,
              submissions: []
            };
          }
          anglerTotals[sub.angler].totalSize += parseFloat(sub.size);
          anglerTotals[sub.angler].catches += 1;
          anglerTotals[sub.angler].submissions.push(sub);
        });

        const winner = Object.values(anglerTotals).sort((a, b) => b.totalSize - a.totalSize)[0];

        if (!winner) return null;

        const winnerUser = users.find(u => u.name === winner.angler);
        const totalAnglers = Object.keys(anglerTotals).length;
        const totalFish = tournamentSubmissions.length;
        const photoSubmission = winner.submissions.find(s => s.photo || s.image) || winner.submissions[0];

        return (
          <div 
            key={tournament.id} 
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition"
          >
            {/* Tournament Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white line-clamp-1">{tournament.name}</h3>
              </div>
              {tournament.location && (
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{tournament.location}</span>
                </div>
              )}
              {(tournament.city || tournament.state) && (
                <div className="flex items-center gap-2 text-white/90 mt-1">
                  <span className="text-sm">
                    {tournament.city}{tournament.city && tournament.state ? ', ' : ''}{tournament.state}
                  </span>
                </div>
              )}
            </div>

            {/* Winner Info */}
            <div className="p-4">
              <div className="flex items-start gap-4 mb-4">
                {/* Winner Avatar */}
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {winnerUser?.avatar ? (
                    <img 
                      src={winnerUser.avatar} 
                      alt={winner.angler} 
                      className="w-16 h-16 rounded-full object-cover" 
                    />
                  ) : (
                    <Users className="w-8 h-8 text-blue-600" />
                  )}
                </div>

                {/* Winner Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                      WINNER
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 truncate">{winner.angler}</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-2">
                      <Fish className="w-4 h-4 text-green-600" />
                      <span>{tournament.species || 'Bass'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fish Photo */}
              {(photoSubmission?.photo || photoSubmission?.image) && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img 
                    src={photoSubmission.photo || photoSubmission.image} 
                    alt="Winning catch" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {winner.totalSize.toFixed(1)}"
                  </div>
                  <div className="text-xs text-gray-600">Total Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{totalAnglers}</div>
                  <div className="text-xs text-gray-600">Anglers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{totalFish}</div>
                  <div className="text-xs text-gray-600">Fish Caught</div>
                </div>
              </div>
            </div>
          </div>
        );
      }).filter(Boolean)}
    </div>
  );
}
