import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  total_solved: number;
  total_points: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch submissions grouped by user with problem points
    const fetchLeaderboard = async () => {
      // Get all solved submissions with problem points
      const { data: submissions } = await supabase
        .from("submissions")
        .select("user_id, problem_id, status, problems(points)")
        .eq("status", "Submitted");

      if (!submissions || submissions.length === 0) {
        setLoading(false);
        return;
      }

      // Group by user - count unique problems and sum points
      const userMap = new Map<string, { solved: Set<string>; points: number }>();
      for (const sub of submissions as any[]) {
        if (!userMap.has(sub.user_id)) {
          userMap.set(sub.user_id, { solved: new Set(), points: 0 });
        }
        const entry = userMap.get(sub.user_id)!;
        if (!entry.solved.has(sub.problem_id)) {
          entry.solved.add(sub.problem_id);
          entry.points += sub.problems?.points || 10;
        }
      }

      // Fetch user profiles
      const userIds = [...userMap.keys()];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

      const leaderboard: LeaderboardEntry[] = [...userMap.entries()]
        .map(([uid, data]) => ({
          user_id: uid,
          full_name: profileMap.get(uid) || "Anonymous",
          total_solved: data.solved.size,
          total_points: data.points,
        }))
        .sort((a, b) => b.total_points - a.total_points);

      setEntries(leaderboard);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="h-5 w-5 text-warning" />;
    if (rank === 1) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (rank === 2) return <Award className="h-5 w-5 text-medium" />;
    return <span className="text-sm font-mono text-muted-foreground w-5 text-center">{rank + 1}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Trophy className="h-10 w-10 mx-auto mb-4 text-warning" />
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Top problem solvers ranked by points earned.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-md border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No submissions yet. Be the first to solve a problem!</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground w-16">Rank</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Name</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Solved</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Points</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={entry.user_id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      i < 3 ? "bg-accent/30" : "hover:bg-accent/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center w-8">{getRankIcon(i)}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{entry.full_name}</td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground">{entry.total_solved}</td>
                    <td className="px-4 py-3 text-right font-semibold">{entry.total_points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
