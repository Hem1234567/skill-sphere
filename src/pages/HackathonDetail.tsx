import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, Users, Trophy, Github, Globe, Play,
  Plus, UserPlus, LogOut as LeaveIcon, Send, Star,
} from "lucide-react";
import { format } from "date-fns";

interface Hackathon {
  id: string; title: string; description: string | null; short_description: string | null;
  banner_url: string | null; start_date: string; end_date: string;
  registration_deadline: string | null; max_team_size: number; min_team_size: number;
  prizes: string | null; rules: string | null; themes: string[] | null; status: string;
}

interface Team {
  id: string; name: string; description: string | null; leader_id: string;
  hackathon_id: string; members: { user_id: string; role: string; profile?: { full_name: string | null } }[];
}

interface Submission {
  id: string; team_id: string; project_name: string; project_description: string | null;
  github_url: string | null; demo_url: string | null; video_url: string | null;
  tech_stack: string[] | null; team?: { name: string };
  scores?: { innovation_score: number; technical_score: number; design_score: number; presentation_score: number }[];
}

export default function HackathonDetail() {
  const { hackathonId } = useParams<{ hackathonId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "teams" | "submissions" | "leaderboard">("overview");

  // Forms
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [techStack, setTechStack] = useState("");

  const fetchData = async () => {
    if (!hackathonId) return;
    const [hRes, tRes, sRes] = await Promise.all([
      supabase.from("hackathons").select("*").eq("id", hackathonId).single(),
      supabase.from("hackathon_teams").select("*").eq("hackathon_id", hackathonId),
      supabase.from("hackathon_submissions").select("*, team:hackathon_teams(name)").eq("hackathon_id", hackathonId),
    ]);
    setHackathon(hRes.data as Hackathon | null);

    // Fetch team members with profiles
    const rawTeams = (tRes.data || []) as any[];
    const teamsWithMembers: Team[] = [];
    for (const t of rawTeams) {
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id, role")
        .eq("team_id", t.id);
      const membersWithProfiles = [];
      for (const m of members || []) {
        const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", m.user_id).single();
        membersWithProfiles.push({ ...m, profile: prof });
      }
      teamsWithMembers.push({ ...t, members: membersWithProfiles });
    }
    setTeams(teamsWithMembers);

    // Fetch scores for submissions
    const rawSubs = (sRes.data || []) as any[];
    const subsWithScores: Submission[] = [];
    for (const s of rawSubs) {
      const { data: scores } = await supabase.from("hackathon_scores").select("*").eq("submission_id", s.id);
      subsWithScores.push({ ...s, scores: scores || [] });
    }
    setSubmissions(subsWithScores);

    // Find user's team
    if (user) {
      const userTeam = teamsWithMembers.find(
        (t) => t.leader_id === user.id || t.members.some((m) => m.user_id === user.id)
      );
      setMyTeam(userTeam || null);
      if (userTeam) {
        const userSub = subsWithScores.find((s) => s.team_id === userTeam.id);
        setMySubmission(userSub || null);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [hackathonId, user]);

  const createTeam = async () => {
    if (!user || !hackathonId || !teamName.trim()) return;
    const { data, error } = await supabase.from("hackathon_teams").insert({
      hackathon_id: hackathonId, name: teamName.trim(), description: teamDesc.trim() || null, leader_id: user.id,
    }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Add leader as member
    await supabase.from("team_members").insert({ team_id: data.id, user_id: user.id, role: "leader" });
    toast({ title: "Team created!" });
    setShowCreateTeam(false); setTeamName(""); setTeamDesc("");
    fetchData();
  };

  const joinTeam = async (teamId: string) => {
    if (!user) return;
    const { error } = await supabase.from("team_members").insert({ team_id: teamId, user_id: user.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Joined team!" });
    fetchData();
  };

  const leaveTeam = async () => {
    if (!user || !myTeam) return;
    await supabase.from("team_members").delete().eq("team_id", myTeam.id).eq("user_id", user.id);
    if (myTeam.leader_id === user.id) {
      // If leader leaves, delete the team
      await supabase.from("hackathon_teams").delete().eq("id", myTeam.id);
    }
    toast({ title: "Left team" });
    fetchData();
  };

  const submitProject = async () => {
    if (!user || !myTeam || !hackathonId || !projName.trim()) return;
    const payload = {
      hackathon_id: hackathonId, team_id: myTeam.id, project_name: projName.trim(),
      project_description: projDesc.trim() || null, github_url: githubUrl.trim() || null,
      demo_url: demoUrl.trim() || null, video_url: videoUrl.trim() || null,
      tech_stack: techStack.split(",").map((s) => s.trim()).filter(Boolean),
    };
    if (mySubmission) {
      const { error } = await supabase.from("hackathon_submissions").update(payload).eq("id", mySubmission.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Submission updated!" });
    } else {
      const { error } = await supabase.from("hackathon_submissions").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Project submitted!" });
    }
    setShowSubmit(false);
    fetchData();
  };

  const canRegister = hackathon && (hackathon.status === "upcoming" || hackathon.status === "active") &&
    (!hackathon.registration_deadline || new Date(hackathon.registration_deadline) > new Date());
  const canSubmit = hackathon && (hackathon.status === "active" || hackathon.status === "judging");

  if (loading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>;
  if (!hackathon) return <div className="container mx-auto px-4 py-20 text-center">Hackathon not found.</div>;

  // Leaderboard calc
  const leaderboard = submissions
    .map((s) => {
      const scores = s.scores || [];
      const total = scores.reduce(
        (sum, sc) => sum + sc.innovation_score + sc.technical_score + sc.design_score + sc.presentation_score, 0
      );
      const avg = scores.length > 0 ? total / scores.length : 0;
      return { ...s, totalScore: avg };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const tabItems = [
    { id: "overview" as const, label: "Overview" },
    { id: "teams" as const, label: `Teams (${teams.length})` },
    { id: "submissions" as const, label: `Submissions (${submissions.length})` },
    { id: "leaderboard" as const, label: "Leaderboard" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      {hackathon.banner_url && (
        <div className="h-48 md:h-64 rounded-lg overflow-hidden mb-6">
          <img src={hackathon.banner_url} alt={hackathon.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-3xl md:text-4xl font-bold">{hackathon.title}</h1>
          <Badge variant="outline" className="capitalize">{hackathon.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(hackathon.start_date), "MMM d")} – {format(new Date(hackathon.end_date), "MMM d, yyyy")}</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{hackathon.min_team_size}–{hackathon.max_team_size} members per team</span>
        </div>
        {hackathon.themes && hackathon.themes.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {hackathon.themes.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
        {tabItems.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {hackathon.description && (
              <div><h2 className="text-lg font-semibold mb-2">About</h2><p className="text-muted-foreground whitespace-pre-line">{hackathon.description}</p></div>
            )}
            {hackathon.rules && (
              <div><h2 className="text-lg font-semibold mb-2">Rules</h2><p className="text-muted-foreground whitespace-pre-line">{hackathon.rules}</p></div>
            )}
          </div>
          <div className="space-y-4">
            {hackathon.prizes && (
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold flex items-center gap-2 mb-2"><Trophy className="h-4 w-4" /> Prizes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{hackathon.prizes}</p>
              </div>
            )}
            {user && canRegister && !myTeam && (
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold mb-3">Get Started</h3>
                <Button className="w-full gap-2" onClick={() => { setShowCreateTeam(true); setTab("teams"); }}>
                  <Plus className="h-4 w-4" /> Create a Team
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">or join an existing team from the Teams tab</p>
              </div>
            )}
            {myTeam && (
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold mb-1">Your Team</h3>
                <p className="text-sm text-primary font-medium">{myTeam.name}</p>
                <p className="text-xs text-muted-foreground">{myTeam.members.length} member(s)</p>
              </div>
            )}
            {!user && (
              <div className="p-6 rounded-lg border border-border bg-card text-center">
                <p className="text-sm text-muted-foreground mb-3">Log in to participate</p>
                <Link to="/login"><Button variant="outline" size="sm">Log in</Button></Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teams */}
      {tab === "teams" && (
        <div className="space-y-6">
          {user && canRegister && !myTeam && (
            <div className="p-6 rounded-lg border border-border bg-card">
              {showCreateTeam ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">Create Team</h3>
                  <Input placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                  <Textarea placeholder="Team description (optional)" value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} />
                  <div className="flex gap-2">
                    <Button onClick={createTeam} disabled={!teamName.trim()}>Create</Button>
                    <Button variant="ghost" onClick={() => setShowCreateTeam(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => setShowCreateTeam(true)} className="gap-2"><Plus className="h-4 w-4" /> Create a Team</Button>
              )}
            </div>
          )}

          {teams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No teams yet. Be the first to register!</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {teams.map((t) => (
                <div key={t.id} className="p-5 rounded-lg border border-border bg-card">
                  <h3 className="font-semibold text-lg mb-1">{t.name}</h3>
                  {t.description && <p className="text-sm text-muted-foreground mb-3">{t.description}</p>}
                  <div className="space-y-1 mb-3">
                    {t.members.map((m) => (
                      <div key={m.user_id} className="text-sm flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {(m.profile?.full_name || "?")[0].toUpperCase()}
                        </span>
                        <span>{m.profile?.full_name || "Unknown"}</span>
                        {m.role === "leader" && <Badge variant="outline" className="text-[10px] py-0">Leader</Badge>}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {user && canRegister && !myTeam && t.members.length < hackathon.max_team_size && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => joinTeam(t.id)}>
                        <UserPlus className="h-3.5 w-3.5" /> Join
                      </Button>
                    )}
                    {user && myTeam?.id === t.id && (
                      <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={leaveTeam}>
                        <LeaveIcon className="h-3.5 w-3.5" /> Leave
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submissions */}
      {tab === "submissions" && (
        <div className="space-y-6">
          {user && myTeam && canSubmit && myTeam.leader_id === user.id && (
            <div className="p-6 rounded-lg border border-border bg-card">
              {showSubmit ? (
                <div className="space-y-3">
                  <h3 className="font-semibold">{mySubmission ? "Update" : "Submit"} Project</h3>
                  <Input placeholder="Project name" value={projName} onChange={(e) => setProjName(e.target.value)} />
                  <Textarea placeholder="Project description" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
                  <Input placeholder="GitHub URL" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
                  <Input placeholder="Demo URL" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} />
                  <Input placeholder="Video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                  <Input placeholder="Tech stack (comma-separated)" value={techStack} onChange={(e) => setTechStack(e.target.value)} />
                  <div className="flex gap-2">
                    <Button onClick={submitProject} disabled={!projName.trim()} className="gap-2"><Send className="h-4 w-4" /> {mySubmission ? "Update" : "Submit"}</Button>
                    <Button variant="ghost" onClick={() => setShowSubmit(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => {
                  if (mySubmission) {
                    setProjName(mySubmission.project_name);
                    setProjDesc(mySubmission.project_description || "");
                    setGithubUrl(mySubmission.github_url || "");
                    setDemoUrl(mySubmission.demo_url || "");
                    setVideoUrl(mySubmission.video_url || "");
                    setTechStack((mySubmission.tech_stack || []).join(", "));
                  }
                  setShowSubmit(true);
                }} className="gap-2">
                  <Send className="h-4 w-4" /> {mySubmission ? "Edit Submission" : "Submit Project"}
                </Button>
              )}
            </div>
          )}

          {submissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
          ) : (
            <div className="grid gap-4">
              {submissions.map((s) => (
                <div key={s.id} className="p-5 rounded-lg border border-border bg-card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{s.project_name}</h3>
                      <p className="text-sm text-muted-foreground">by {s.team?.name || "Unknown team"}</p>
                    </div>
                  </div>
                  {s.project_description && <p className="text-sm text-muted-foreground mb-3">{s.project_description}</p>}
                  {s.tech_stack && s.tech_stack.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {s.tech_stack.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                    </div>
                  )}
                  <div className="flex gap-3">
                    {s.github_url && (
                      <a href={s.github_url} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <Github className="h-4 w-4" /> GitHub
                      </a>
                    )}
                    {s.demo_url && (
                      <a href={s.demo_url} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <Globe className="h-4 w-4" /> Demo
                      </a>
                    )}
                    {s.video_url && (
                      <a href={s.video_url} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1 text-muted-foreground hover:text-foreground">
                        <Play className="h-4 w-4" /> Video
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {tab === "leaderboard" && (
        <div>
          {leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No scores yet.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">#</th>
                    <th className="text-left px-4 py-3 font-medium">Project</th>
                    <th className="text-left px-4 py-3 font-medium">Team</th>
                    <th className="text-right px-4 py-3 font-medium">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((s, i) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium">{s.project_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.team?.name}</td>
                      <td className="px-4 py-3 text-right font-bold">{s.totalScore.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
