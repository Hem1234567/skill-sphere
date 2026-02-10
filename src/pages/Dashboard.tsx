import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { BookOpen, Code, Trophy, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ coursesEnrolled: 0, problemsSolved: 0, totalSubmissions: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    Promise.all([
      supabase.from("user_courses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "Solved"),
    ]).then(([courses, subs, solved]) => {
      setStats({
        coursesEnrolled: courses.count || 0,
        totalSubmissions: subs.count || 0,
        problemsSolved: solved.count || 0,
      });
      setLoadingStats(false);
    });
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const cards = [
    { icon: BookOpen, label: "Courses Enrolled", value: stats.coursesEnrolled },
    { icon: Code, label: "Total Submissions", value: stats.totalSubmissions },
    { icon: CheckCircle, label: "Problems Solved", value: stats.problemsSolved },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome back! Here's your progress overview.</p>

      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        {cards.map((card) => (
          <div key={card.label} className="p-6 rounded-lg border border-border bg-card">
            <card.icon className="h-8 w-8 mb-3 text-muted-foreground" />
            <p className="text-3xl font-bold">{loadingStats ? "—" : card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Keep going!</h2>
        <p className="text-muted-foreground">Explore courses and solve more problems to track your growth here.</p>
      </div>
    </div>
  );
}
