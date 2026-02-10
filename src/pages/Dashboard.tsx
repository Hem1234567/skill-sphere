import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { BookOpen, Code, Trophy, CheckCircle, ChevronRight, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { generateCertificate } from "@/lib/certificate";

interface EnrolledCourse {
  course_id: string;
  progress_percentage: number;
  course: { title: string; difficulty: string | null; estimated_duration: string | null } | null;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ coursesEnrolled: 0, problemsSolved: 0, totalSubmissions: 0 });
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase.from("user_courses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "Solved"),
      supabase
        .from("user_courses")
        .select("course_id, progress_percentage, course:courses(title, difficulty, estimated_duration)")
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false }),
    ]).then(([courses, subs, solved, enrolled]) => {
      setStats({
        coursesEnrolled: courses.count || 0,
        totalSubmissions: subs.count || 0,
        problemsSolved: solved.count || 0,
      });
      setEnrolledCourses((enrolled.data as unknown as EnrolledCourse[]) || []);
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

      <div className="grid sm:grid-cols-3 gap-6 mb-10">
        {cards.map((card) => (
          <div key={card.label} className="p-6 rounded-lg border border-border bg-card">
            <card.icon className="h-8 w-8 mb-3 text-muted-foreground" />
            <p className="text-3xl font-bold">{loadingStats ? "—" : card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Enrolled Courses Widget */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Courses</h2>
          <Link to="/courses" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            Browse all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {loadingStats ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-lg border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No courses enrolled yet.</p>
            <Link to="/courses">
              <Button variant="outline" size="sm" className="mt-3">Explore Courses</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enrolledCourses.map((ec) => {
              const prog = ec.progress_percentage || 0;
              const title = ec.course?.title || "Untitled";
              return (
                <div key={ec.course_id} className="p-4 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Link to={`/courses/${ec.course_id}`} className="font-medium hover:underline truncate block">
                      {title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {ec.course?.difficulty && <span>{ec.course.difficulty}</span>}
                      {ec.course?.estimated_duration && <span>{ec.course.estimated_duration}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Progress value={prog} className="h-2 flex-1" />
                      <span className="text-xs font-medium w-10 text-right">{prog}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {prog === 100 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          const name = user?.user_metadata?.full_name || user?.email || "Student";
                          generateCertificate(name, title, new Date().toLocaleDateString());
                        }}
                      >
                        <Download className="h-3.5 w-3.5" /> Certificate
                      </Button>
                    ) : (
                      <Link to={`/courses/${ec.course_id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          Continue <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Keep going!</h2>
        <p className="text-muted-foreground">Explore courses and solve more problems to track your growth here.</p>
      </div>
    </div>
  );
}
