import { Trophy, Rocket, Users, Award } from "lucide-react";

const roadmap = [
  { icon: Users, title: "Team Formation", description: "Create and manage hackathon teams" },
  { icon: Rocket, title: "Project Submission", description: "Submit projects with GitHub repos and demos" },
  { icon: Award, title: "Judging & Leaderboard", description: "Fair judging with public leaderboards" },
];

export default function Hackathons() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Hackathons</h1>
        <p className="text-lg text-muted-foreground mb-2">Coming Soon 🚀</p>
        <p className="text-muted-foreground max-w-md mx-auto mb-12">
          We're building a Devfolio-style hackathon platform where you can register teams, submit projects, and compete.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {roadmap.map((item) => (
            <div key={item.title} className="p-6 rounded-lg border border-border bg-card text-center">
              <item.icon className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
