import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Code } from "lucide-react";

interface Problem {
  id: string;
  title: string;
  difficulty: string | null;
  tags: string[] | null;
  points: number | null;
}

const difficultyColor: Record<string, string> = {
  Easy: "text-easy",
  Medium: "text-medium",
  Hard: "text-hard",
};

export default function Practice() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("problems")
      .select("id, title, difficulty, tags, points")
      .eq("is_published", true)
      .then(({ data }) => {
        setProblems((data as Problem[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchDiff = !diffFilter || p.difficulty === diffFilter;
    return matchSearch && matchDiff;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mb-10">
        <h1 className="text-3xl font-bold mb-2">Practice</h1>
        <p className="text-muted-foreground">Solve coding problems to sharpen your skills.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search problems..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          {["", "Easy", "Medium", "Hard"].map((d) => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                diffFilter === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"
              }`}
            >
              {d || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-md border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No problems yet</h2>
          <p className="text-muted-foreground">Problems will appear here once published.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Difficulty</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Tags</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Points</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/practice/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium hidden sm:table-cell ${difficultyColor[p.difficulty || "Easy"]}`}>
                    {p.difficulty}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">{p.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
