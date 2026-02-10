import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Play, ChevronRight, Trophy, Download } from "lucide-react";
import { generateCertificate } from "@/lib/certificate";

interface Course {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  tags: string[] | null;
  estimated_duration: string | null;
}

interface Lesson {
  id: string;
  title: string;
  video_url: string | null;
  content: string | null;
  module_name: string | null;
  lesson_order: number | null;
}

interface Quiz {
  id: string;
  module_name: string | null;
  question: string;
  options: string[];
  answer: string;
  marks: number | null;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
      supabase.from("lessons").select("*").eq("course_id", courseId).order("lesson_order"),
      supabase.from("quizzes").select("*").eq("course_id", courseId),
    ]).then(([courseRes, lessonsRes, quizzesRes]) => {
      setCourse(courseRes.data as Course | null);
      const ls = (lessonsRes.data as Lesson[]) || [];
      setLessons(ls);
      setQuizzes((quizzesRes.data as Quiz[]) || []);
      if (ls.length > 0) setSelectedLesson(ls[0]);
      setLoading(false);
    });
  }, [courseId]);

  useEffect(() => {
    if (!user || !courseId) return;
    supabase.from("user_courses").select("id").eq("user_id", user.id).eq("course_id", courseId).maybeSingle()
      .then(({ data }) => setEnrolled(!!data));
    supabase.from("lesson_completions").select("lesson_id").eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setCompletedLessons(new Set(data.map((d: any) => d.lesson_id)));
      });
  }, [user, courseId]);

  const handleEnroll = async () => {
    if (!user || !courseId) {
      toast({ title: "Please log in to enroll", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("user_courses").insert({ user_id: user.id, course_id: courseId });
    if (!error) {
      setEnrolled(true);
      toast({ title: "Enrolled successfully!" });
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!user) return;
    const { error } = await supabase.from("lesson_completions").insert({ user_id: user.id, lesson_id: lessonId });
    if (!error) {
      setCompletedLessons((prev) => new Set([...prev, lessonId]));
      // Update progress
      const progress = Math.round(((completedLessons.size + 1) / lessons.length) * 100);
      await supabase.from("user_courses").update({ progress_percentage: progress }).eq("user_id", user.id).eq("course_id", courseId!);
    }
  };

  const handleQuizSubmit = async () => {
    if (!user) return;
    setQuizSubmitted(true);
    for (const quiz of quizzes) {
      const selected = quizAnswers[quiz.id];
      if (selected) {
        await supabase.from("quiz_attempts").insert({
          user_id: user.id,
          quiz_id: quiz.id,
          selected_answer: selected,
          is_correct: selected === quiz.answer,
        });
      }
    }
    const correct = quizzes.filter((q) => quizAnswers[q.id] === q.answer).length;
    toast({ title: `Quiz completed! ${correct}/${quizzes.length} correct` });
  };

  const progress = lessons.length > 0 ? Math.round((completedLessons.size / lessons.length) * 100) : 0;

  // Group lessons by module
  const modules = lessons.reduce<Record<string, Lesson[]>>((acc, l) => {
    const mod = l.module_name || "General";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(l);
    return acc;
  }, {});

  if (loading) return <div className="container mx-auto px-4 py-12"><div className="h-8 w-64 bg-muted animate-pulse rounded mb-4" /></div>;
  if (!course) return <div className="container mx-auto px-4 py-20 text-center"><h2 className="text-xl font-semibold">Course not found</h2></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Course header */}
      <div className="mb-8">
        <Link to="/courses" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">← Back to Courses</Link>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-muted-foreground max-w-2xl mb-3">{course.description}</p>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{course.difficulty}</Badge>
              {course.estimated_duration && <span className="text-sm text-muted-foreground">{course.estimated_duration}</span>}
              <span className="text-sm text-muted-foreground">{lessons.length} lessons</span>
            </div>
          </div>
          {!enrolled && user && (
            <Button onClick={handleEnroll} size="lg">Enroll Now</Button>
          )}
        </div>
        {enrolled && (
          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress === 100 && (
              <Button
                variant="outline"
                className="mt-3 gap-2"
                onClick={() => {
                  const profileName = user?.user_metadata?.full_name || user?.email || "Student";
                  generateCertificate(profileName, course.title, new Date().toLocaleDateString());
                }}
              >
                <Download className="h-4 w-4" /> Download Certificate
              </Button>
            )}
          </div>
        )}
      </div>

      {!quizMode ? (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lesson sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-20 space-y-4">
              {Object.entries(modules).map(([moduleName, moduleLessons]) => (
                <div key={moduleName}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{moduleName}</h3>
                  <div className="space-y-1">
                    {moduleLessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-left transition-colors ${
                          selectedLesson?.id === lesson.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        {completedLessons.has(lesson.id) ? (
                          <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {quizzes.length > 0 && (
                <Button variant="outline" className="w-full gap-2" onClick={() => setQuizMode(true)}>
                  <Trophy className="h-4 w-4" /> Take Quiz ({quizzes.length} questions)
                </Button>
              )}
            </div>
          </div>

          {/* Lesson content */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {selectedLesson ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">{selectedLesson.title}</h2>
                {selectedLesson.video_url && (
                  <div className="aspect-video rounded-lg overflow-hidden border border-border mb-6 bg-card">
                    <iframe
                      src={selectedLesson.video_url}
                      title={selectedLesson.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                )}
                {selectedLesson.content && (
                  <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                    <p className="whitespace-pre-wrap">{selectedLesson.content}</p>
                  </div>
                )}
                {enrolled && !completedLessons.has(selectedLesson.id) && (
                  <Button onClick={() => handleCompleteLesson(selectedLesson.id)} className="gap-2">
                    <CheckCircle className="h-4 w-4" /> Mark as Complete
                  </Button>
                )}
                {enrolled && completedLessons.has(selectedLesson.id) && (
                  <p className="text-sm text-success flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Completed</p>
                )}
                {/* Next lesson button */}
                {(() => {
                  const idx = lessons.findIndex((l) => l.id === selectedLesson.id);
                  const next = lessons[idx + 1];
                  return next ? (
                    <Button variant="ghost" className="mt-4 gap-2" onClick={() => setSelectedLesson(next)}>
                      Next: {next.title} <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : null;
                })()}
              </div>
            ) : (
              <p className="text-muted-foreground">Select a lesson to begin.</p>
            )}
          </div>
        </div>
      ) : (
        /* Quiz Mode */
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Quiz</h2>
            <Button variant="ghost" onClick={() => { setQuizMode(false); setQuizSubmitted(false); setQuizAnswers({}); }}>← Back to Lessons</Button>
          </div>
          <div className="space-y-6">
            {quizzes.map((quiz, i) => (
              <div key={quiz.id} className="p-6 rounded-lg border border-border bg-card">
                <p className="font-medium mb-4">{i + 1}. {quiz.question}</p>
                <div className="space-y-2">
                  {quiz.options.map((opt) => {
                    const selected = quizAnswers[quiz.id] === opt;
                    const isCorrect = quizSubmitted && opt === quiz.answer;
                    const isWrong = quizSubmitted && selected && opt !== quiz.answer;
                    return (
                      <button
                        key={opt}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers({ ...quizAnswers, [quiz.id]: opt })}
                        className={`w-full text-left px-4 py-2.5 rounded-md border text-sm transition-colors ${
                          isCorrect ? "border-success bg-success/10 text-success" :
                          isWrong ? "border-destructive bg-destructive/10 text-destructive" :
                          selected ? "border-foreground bg-accent" :
                          "border-border hover:bg-accent"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!quizSubmitted ? (
              <Button onClick={handleQuizSubmit} className="w-full" disabled={Object.keys(quizAnswers).length === 0}>
                Submit Quiz
              </Button>
            ) : (
              <div className="text-center p-6 rounded-lg border border-border bg-card">
                <Trophy className="h-10 w-10 mx-auto mb-3 text-warning" />
                <p className="text-xl font-bold">
                  {quizzes.filter((q) => quizAnswers[q.id] === q.answer).length} / {quizzes.length} correct
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
