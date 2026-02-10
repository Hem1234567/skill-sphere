import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Code, Trophy, ArrowRight, Sparkles, Target, BarChart3 } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Structured Courses",
    description: "Learn through well-organized courses with lessons, modules, and quizzes.",
  },
  {
    icon: Code,
    title: "Practice Problems",
    description: "Sharpen your skills with coding challenges in a VS Code-style editor.",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "Monitor your learning journey with detailed analytics and streaks.",
  },
];

export default function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              100% Free — No Premium Walls
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Upgrade Your Skills with{" "}
              <span className="underline decoration-2 underline-offset-4">Coding Society</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
              Learn courses and practice coding problems — all in one place, completely free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link to="/courses">
                <Button size="lg" className="gap-2 text-base px-8">
                  Explore Courses <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/practice">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                  Start Practice <Target className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </section>

      {/* Features */}
      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hackathons Banner */}
      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="rounded-lg border border-border bg-card p-8 md:p-12 text-center">
            <Trophy className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Hackathons Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're building a Devfolio-style hackathon platform. Register teams, submit projects, and compete. Stay tuned! 🚀
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
