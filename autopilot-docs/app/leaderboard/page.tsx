'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Flame, Timer, GitCommit, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import clsx from 'clsx';

// Simulated data removed


export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      
      const formattedUsers = data.map((u: any, index: number) => ({
        ...u,
        name: u.username,
        avatar: u.username.substring(0, 2).toUpperCase(),
        // Convert minutes to "42h 15m" format
        focusTime: `${Math.floor(u.focusMinutes / 60)}h ${u.focusMinutes % 60}m`,
        trend: 'same' // Placeholder as we don't store history yet
      }));
      
      setUsers(formattedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center border-b border-border bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 mb-6">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-medium">Global Rankings</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Autopilot <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-600">Leaderboard</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            See who's coding the most effectively. Track focus time, commit consistency, and productivity streaks.
          </p>
          
          <div className="flex items-center justify-center gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border border-border shadow-sm">
               <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-sm font-medium text-muted-foreground">Live Updates</span>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-12 px-4 container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center gap-4 mb-4">
               <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                 <GitCommit className="h-6 w-6" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Total Commits</p>
                 <h3 className="text-2xl font-bold">1.2M+</h3>
               </div>
             </div>
             <p className="text-sm text-muted-foreground">Across all users this month</p>
           </div>
           
           <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center gap-4 mb-4">
               <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                 <Timer className="h-6 w-6" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Focus Hours</p>
                 <h3 className="text-2xl font-bold">850k+</h3>
               </div>
             </div>
             <p className="text-sm text-muted-foreground">Deep work time tracked</p>
           </div>
           
           <div className="p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
             <div className="flex items-center gap-4 mb-4">
               <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500">
                 <Flame className="h-6 w-6" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Active Streaks</p>
                 <h3 className="text-2xl font-bold">4,200+</h3>
               </div>
             </div>
             <p className="text-sm text-muted-foreground">Devs coding daily</p>
           </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Medal className="h-5 w-5 text-yellow-500" />
              Top Contributors
            </h2>
            <div className="flex gap-2 text-sm">
              <button className="px-3 py-1.5 rounded-md bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors">This Week</button>
              <button className="px-3 py-1.5 rounded-md text-muted-foreground hover:bg-secondary/50 transition-colors">All Time</button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-sm">
                  <th className="p-4 font-medium w-16 text-center">Rank</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium text-right">Focus Time</th>
                  <th className="p-4 font-medium text-right">Commits</th>
                  <th className="p-4 font-medium text-center">Streak</th>
                  <th className="p-4 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user, index) => (
                  <tr key={user.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-center font-bold text-muted-foreground">
                      <div className="flex items-center justify-center gap-1">
                        {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                        {index === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                        <span className={clsx(
                          index < 3 ? 'text-foreground' : '',
                          'w-6'
                        )}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {user.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {user.name}
                            {user.id === 1 && <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-500 font-bold border border-yellow-500/20">PRO</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-sm text-muted-foreground">{user.focusTime}</td>
                    <td className="p-4 text-right font-mono text-sm text-muted-foreground">{user.commits}</td>
                    <td className="p-4 text-center">
                       <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold">
                         <Flame className="h-3 w-3" />
                         {user.streak}
                       </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-mono font-bold text-foreground">{user.score.toLocaleString()}</div>
                      <div className="flex items-center justify-end gap-1 text-xs mt-0.5">
                        {user.trend === 'up' && <ArrowUp className="h-3 w-3 text-green-500" />}
                        {user.trend === 'down' && <ArrowDown className="h-3 w-3 text-red-500" />}
                        {user.trend === 'same' && <Minus className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-muted/30 border-t border-border text-center">
         <div className="container mx-auto max-w-2xl">
           <h2 className="text-3xl font-bold mb-4">Join the Leaderboard</h2>
           <p className="text-muted-foreground mb-8">
             Start tracking your productivity today. Enable insights in Autopilot CLI to participate.
           </p>
           <div className="bg-[#1c1c1c] rounded-lg p-4 font-mono text-sm text-gray-300 inline-flex items-center gap-2 shadow-lg mx-auto">
             <span className="text-green-400">$</span> autopilot insights --enable-sharing
           </div>
           <p className="text-xs text-muted-foreground mt-4">
             (Coming soon in v2.1)
           </p>
         </div>
      </section>
    </div>
  );
}
