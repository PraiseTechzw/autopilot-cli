import { useState, useEffect } from 'react';
import { Trophy, Medal, Flame, Timer, GitCommit, Activity, ArrowUp, ArrowDown, Minus, Search } from 'lucide-react';
import clsx from 'clsx';

interface UserStats {
  id: string;
  username: string;
  score: number;
  commits: number;
  focusMinutes: number;
  streak: number;
  lastActive: string;
  name?: string;
  avatar?: string;
  focusTime?: string;
  trend?: 'up' | 'down' | 'same';
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ totalCommits: 0, totalFocusMinutes: 0, activeStreaks: 0 });

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      const formattedUsers = data.map((u: UserStats) => ({
        ...u,
        name: u.username,
        avatar: u.username.substring(0, 2).toUpperCase(),
        focusTime: `${Math.floor(u.focusMinutes / 60)}h ${u.focusMinutes % 60}m`,
        trend: 'same' as const,
      }));
      setUsers(formattedUsers);
      setStats({
        totalCommits: data.reduce((acc: number, u: UserStats) => acc + (u.commits || 0), 0),
        totalFocusMinutes: data.reduce((acc: number, u: UserStats) => acc + (u.focusMinutes || 0), 0),
        activeStreaks: data.filter((u: UserStats) => (u.streak || 0) > 0).length,
      });
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()));

  const formatFocusLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
    return `${(minutes / 60).toFixed(0)}h`;
  };

  const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const TrendIcon = ({ trend }: { trend?: string }) => {
    if (trend === 'up') return <ArrowUp className="h-3 w-3 text-green-400" />;
    if (trend === 'down') return <ArrowDown className="h-3 w-3 text-red-400" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background selection:bg-link/30">
      {/* Hero Section */}
      <section className="relative py-24 px-4 text-center overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(184,255,31,0.12),transparent_50%)]" />
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-link/10 text-link border border-link/20 mb-8 animate-fade-in">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-semibold tracking-wide uppercase">Autopilot Universe</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-link via-lime-400 to-emerald-500 animate-gradient-x">Productivity</span> Leaderboard
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Where elite developers track focus, consistency, and velocity. Powered by high-integrity Git analytics.
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2.5 px-5 py-2.5 bg-background/50 backdrop-blur-md rounded-2xl border border-border shadow-2xl">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
              <span className="text-sm font-semibold text-foreground/80 lowercase tracking-wider">Live Metrics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Commits', value: stats.totalCommits.toLocaleString(), icon: GitCommit, color: 'text-link' },
            { label: 'Focus Time', value: formatFocusLabel(stats.totalFocusMinutes), icon: Timer, color: 'text-emerald-400' },
            { label: 'Active Streaks', value: stats.activeStreaks.toString(), icon: Flame, color: 'text-orange-400' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2">
              <s.icon className={clsx('h-6 w-6', s.color)} />
              <span className="text-2xl font-black text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search developers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-link/30 focus:border-link/50 transition-all"
          />
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Rank</span>
            <span>Developer</span>
            <span className="text-right">Score</span>
            <span className="text-right hidden sm:block">Commits</span>
            <span className="text-right hidden md:block">Focus</span>
            <span className="text-right hidden sm:block">Streak</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Activity className="h-8 w-8 text-link animate-pulse" />
                <p className="text-muted-foreground text-sm">Loading leaderboard...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Trophy className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">{search ? 'No developers found' : 'No data yet'}</p>
              <p className="text-xs text-muted-foreground/60">Run Autopilot and sync your stats to appear here</p>
            </div>
          ) : (
            filteredUsers.map((user, idx) => {
              const rank = idx + 1;
              return (
                <div
                  key={user.id}
                  className={clsx(
                    'grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-4 items-center border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20',
                    rank === 1 && 'bg-link/5 hover:bg-link/10',
                    rank === 2 && 'bg-slate-500/5',
                    rank === 3 && 'bg-amber-500/5',
                  )}
                >
                  <div className="flex items-center justify-center w-8">
                    <RankIcon rank={rank} />
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx(
                      'h-10 w-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0',
                      rank === 1 ? 'bg-link text-black' : rank === 2 ? 'bg-slate-600 text-white' : rank === 3 ? 'bg-amber-700 text-white' : 'bg-muted text-foreground'
                    )}>
                      {user.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{user.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendIcon trend={user.trend} />
                        <span>Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-link">{user.score.toLocaleString()}</span>
                    <p className="text-[10px] text-muted-foreground">pts</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="font-semibold text-foreground">{user.commits}</span>
                    <p className="text-[10px] text-muted-foreground">commits</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <span className="font-semibold text-foreground">{formatFocusLabel(user.focusMinutes)}</span>
                    <p className="text-[10px] text-muted-foreground">focus</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="font-semibold text-foreground flex items-center justify-end gap-1">
                      {user.streak > 0 && <Flame className="h-3 w-3 text-orange-400" />}
                      {user.streak}
                    </span>
                    <p className="text-[10px] text-muted-foreground">days</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Run <code className="text-link">autopilot leaderboard</code> to sync your stats
        </p>
      </div>
    </div>
  );
}
