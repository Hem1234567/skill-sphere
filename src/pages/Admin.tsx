import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import AdminCourses from "@/components/admin/AdminCourses";
import AdminProblems from "@/components/admin/AdminProblems";
import AdminLessons from "@/components/admin/AdminLessons";
import AdminQuizzes from "@/components/admin/AdminQuizzes";
import AdminUsers from "@/components/admin/AdminUsers";
import { LayoutDashboard, BookOpen, Code, Users, FileText, HelpCircle } from "lucide-react";

type Tab = "overview" | "courses" | "problems" | "lessons" | "quizzes" | "users";

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState({ courses: 0, problems: 0, users: 0, submissions: 0 });
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(data === true);
      if (data !== true) {
        toast({ title: "Access denied", description: "You don't have admin privileges.", variant: "destructive" });
      }
    });
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      supabase.from("courses").select("id", { count: "exact", head: true }),
      supabase.from("problems").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("submissions").select("id", { count: "exact", head: true }),
    ]).then(([c, p, u, s]) => {
      setStats({
        courses: c.count || 0,
        problems: p.count || 0,
        users: u.count || 0,
        submissions: s.count || 0,
      });
    });
  }, [isAdmin]);

  if (authLoading || isAdmin === null) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: LayoutDashboard },
    { id: "courses" as Tab, label: "Courses", icon: BookOpen },
    { id: "lessons" as Tab, label: "Lessons", icon: FileText },
    { id: "quizzes" as Tab, label: "Quizzes", icon: HelpCircle },
    { id: "problems" as Tab, label: "Problems", icon: Code },
    { id: "users" as Tab, label: "Users", icon: Users },
  ];

  const statCards = [
    { label: "Total Courses", value: stats.courses, icon: BookOpen },
    { label: "Total Problems", value: stats.problems, icon: Code },
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Submissions", value: stats.submissions, icon: LayoutDashboard },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">Admin Panel</h1>
      <p className="text-muted-foreground mb-8">Manage your platform content and settings.</p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((s) => (
            <div key={s.label} className="p-6 rounded-lg border border-border bg-card">
              <s.icon className="h-6 w-6 mb-3 text-muted-foreground" />
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "courses" && <AdminCourses />}
      {tab === "lessons" && <AdminLessons />}
      {tab === "quizzes" && <AdminQuizzes />}
      {tab === "problems" && <AdminProblems />}
      {tab === "users" && <AdminUsers />}
    </div>
  );
}
