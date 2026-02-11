'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Flame, Timer, GitCommit, Activity, ArrowUp, ArrowDown, Minus, Search, Info } from 'lucide-react';
import clsx from 'clsx';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    totalCommits: 0,
    totalFocusMinutes: 0,
    activeStreaks: 0
  });

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();

      const formattedUsers = data.map((u: any, index: number) => ({
        ...u,
        name: u.username,
        avatar: u.username.substring(0, 2).toUpperCase(),
        focusTime: `${Math.floor(u.focusMinutes / 60)}h ${u.focusMinutes % 60}m`,
        trend: 'same'
      }));

      setUsers(formattedUsers);

      // Calculate totals
      const totalCommits = data.reduce((acc: number, u: any) => acc + (u.commits || 0), 0);
      const totalFocusMinutes = data.reduce((acc: number, u: any) => acc + (u.focusMinutes || 0), 0);
      const activeStreaks = data.filter((u: any) => (u.streak || 0) > 0).length;

      setStats({
        totalCommits,
        totalFocusMinutes,
        activeStreaks
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatFocusLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
    return `${(minutes / 60).toFixed(0)}h`;
  };

  return (
    <div className="min-h-screen bg-background selection:bg-yellow-500/30">
      {/* Animated Hero Section */}
      <section className="relative py-24 px-4 text-center overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(234,179,8,0.1),transparent_50%)]" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-semibold tracking-wide uppercase">Autopilot Universe</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 animate-gradient-x">Productivity</span> Leaderboard
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Where elite developers track focus, consistency, and velocity.
            Powered by high-integrity Git analytics.
          </p>

          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2.5 px-5 py-2.5 bg-background/50 backdrop-blur-md rounded-2xl border border-border shadow-2xl transition-all hover:border-yellow-500/30">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
              <span className="text-sm font-semibold text-foreground/80 lowercase tracking-wider">Live Metrics</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
      </section>

      {/* Analytics Overview */}
      <section className="py-16 px-4 container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { label: 'Total Commits', value: stats.totalCommits.toLocaleString(), icon: GitCommit, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Focus Time', value: formatFocusLabel(stats.totalFocusMinutes), icon: Timer, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Active Streaks', value: stats.activeStreaks.toLocaleString(), icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' }
          ].map((stat, i) => (
            <div key={i} className="group p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500">
                <stat.icon className="h-24 w-24" />
              </div>
              <div className="flex items-center gap-5 relative z-10">
                <div className={clsx("p-4 rounded-xl shadow-inner", stat.bg, stat.color)}>
                  <stat.icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-black mt-1 tracking-tight">{stat.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global Rankings Card */}
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700 delay-300">
          <div className="p-8 border-b border-border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500 rounded-2xl shadow-lg shadow-yellow-500/20">
                <Medal className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Top Contributors</h2>
                <p className="text-sm text-muted-foreground font-medium">Rankings updated every 10 seconds</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative group w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-yellow-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search contributors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500/50 transition-all font-medium"
                />
              </div>
              <div className="flex bg-secondary/50 p-1.5 rounded-xl border border-border self-end sm:self-auto">
                <button className="px-4 py-1.5 rounded-lg bg-card text-foreground font-bold text-xs shadow-sm shadow-black/5 hover:scale-[1.02] active:scale-[0.98] transition-all">WEEKLY</button>
                <button className="px-4 py-1.5 rounded-lg text-muted-foreground font-bold text-xs hover:text-foreground transition-colors">ALL TIME</button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-[0.15em] font-black">
                  <th className="p-6 w-24 text-center">Rank</th>
                  <th className="p-6">Developer</th>
                  <th className="p-6 text-right">Deep Work</th>
                  <th className="p-6 text-right">Activity</th>
                  <th className="p-6 text-center">Streak</th>
                  <th className="p-6 text-right pr-12">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredUsers.length > 0 ? filteredUsers.map((user, index) => (
                  <tr key={user.id} className="group hover:bg-yellow-500/[0.02] transition-colors">
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center">
                        {index === 0 && (
                          <div className="relative">
                            <Trophy className="h-6 w-6 text-yellow-500 fill-yellow-500/20" />
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-card" />
                          </div>
                        )}
                        {index === 1 && <Medal className="h-6 w-6 text-zinc-400 fill-zinc-400/10" />}
                        {index === 2 && <Medal className="h-6 w-6 text-amber-700 fill-amber-700/10" />}
                        {index > 2 && <span className="text-lg font-black text-muted-foreground/30 font-mono tracking-tighter">{index + 1}</span>}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-orange-900/40 flex items-center justify-center text-yellow-700 dark:text-yellow-400 text-sm font-black border border-yellow-500/10 ring-4 ring-yellow-500/5 group-hover:scale-110 transition-transform">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-base group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-[10px] font-black tracking-widest text-muted-foreground/50 uppercase mt-0.5">Contributor</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-right font-mono text-sm font-bold text-muted-foreground/80">{user.focusTime}</td>
                    <td className="p-6 text-right font-mono text-sm font-bold text-muted-foreground/80">{user.commits} Commits</td>
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/10">
                        <Flame className="h-3.5 w-3.5 fill-orange-500" />
                        <span className="text-xs font-black tracking-tighter">{user.streak}d</span>
                      </div>
                    </td>
                    <td className="p-6 text-right pr-12">
                      <div className="flex flex-col items-end">
                        <span className="text-xl font-black text-foreground tabular-nums tracking-tighter decoration-yellow-500/30 underline-offset-4 decoration-2">{user.score.toLocaleString()}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          {user.trend === 'up' && <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
                          <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-0 group-hover:opacity-100 transition-opacity">Global Points</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="p-24 text-center">
                      <div className="max-w-xs mx-auto opacity-40">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                        <h3 className="text-lg font-bold mb-1">No contributors found</h3>
                        <p className="text-sm">Be the first to sync your stats to our global ranking system!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Sync CTA */}
      <section className="py-24 px-4 bg-secondary/30 relative overflow-hidden border-t border-border">
        <div className="container mx-auto max-w-3xl relative z-10 text-center">
          <div className="inline-flex p-4 rounded-3xl bg-card border border-border shadow-2xl mb-8 animate-bounce">
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-tight">Sync & Compete</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed">
            Sync your local developer metrics with the global community.
            Only anonymous totals are shared—your code always stays private.
          </p>

          <div className="flex flex-col items-center gap-6">
            <div className="group relative w-full max-w-md">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-60 transition duration-1000"></div>
              <div className="relative flex items-center justify-between gap-4 p-5 bg-[#0e0e0e] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4">
                  <span className="p-2 bg-white/5 rounded-lg text-yellow-500"><GitCommit className="h-5 w-5" /></span>
                  <code className="font-mono text-sm sm:text-base text-gray-200 tracking-tight">
                    <span className="text-yellow-500">autopilot</span> leaderboard --sync
                  </code>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText('autopilot leaderboard --sync')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <GitCommit className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
              <Info className="h-3 w-3" />
              <span>Available in v2.1.0 and above</span>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 5s linear infinite;
        }
      `}</style>
    </div>
  );
}
