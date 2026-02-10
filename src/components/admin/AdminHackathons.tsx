import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react";

interface Hackathon {
  id: string; title: string; description: string | null; short_description: string | null;
  start_date: string; end_date: string; registration_deadline: string | null;
  max_team_size: number; min_team_size: number; prizes: string | null; rules: string | null;
  themes: string[] | null; status: string; is_published: boolean; banner_url: string | null;
}

interface Submission {
  id: string; project_name: string; team?: { name: string };
  scores: { id: string; judge_id: string; innovation_score: number; technical_score: number; design_score: number; presentation_score: number }[];
}

const emptyForm = {
  title: "", description: "", short_description: "", start_date: "", end_date: "",
  registration_deadline: "", max_team_size: 4, min_team_size: 1, prizes: "", rules: "",
  themes: "", status: "upcoming", banner_url: "",
};

export default function AdminHackathons() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [judgingHackathon, setJudgingHackathon] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [scoreForm, setScoreForm] = useState({ submissionId: "", innovation: 0, technical: 0, design: 0, presentation: 0, comments: "" });
  const { toast } = useToast();

  const fetchHackathons = async () => {
    const { data } = await supabase.from("hackathons").select("*").order("created_at", { ascending: false });
    setHackathons((data as Hackathon[]) || []);
  };

  useEffect(() => { fetchHackathons(); }, []);

  const fetchSubmissions = async (hackathonId: string) => {
    const { data } = await supabase.from("hackathon_submissions")
      .select("id, project_name, team:hackathon_teams(name)")
      .eq("hackathon_id", hackathonId);
    const subs: Submission[] = [];
    for (const s of data || []) {
      const { data: scores } = await supabase.from("hackathon_scores").select("*").eq("submission_id", s.id);
      subs.push({ ...s, scores: scores || [] } as any);
    }
    setSubmissions(subs);
  };

  const save = async () => {
    const payload = {
      title: form.title, description: form.description || null, short_description: form.short_description || null,
      start_date: form.start_date, end_date: form.end_date,
      registration_deadline: form.registration_deadline || null,
      max_team_size: form.max_team_size, min_team_size: form.min_team_size,
      prizes: form.prizes || null, rules: form.rules || null,
      themes: form.themes.split(",").map((s) => s.trim()).filter(Boolean),
      status: form.status, banner_url: form.banner_url || null,
    };
    if (editId) {
      await supabase.from("hackathons").update(payload).eq("id", editId);
      toast({ title: "Hackathon updated" });
    } else {
      await supabase.from("hackathons").insert(payload);
      toast({ title: "Hackathon created" });
    }
    setShowForm(false); setEditId(null); setForm(emptyForm);
    fetchHackathons();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("hackathons").update({ is_published: !current }).eq("id", id);
    fetchHackathons();
  };

  const deleteHackathon = async (id: string) => {
    await supabase.from("hackathons").delete().eq("id", id);
    toast({ title: "Hackathon deleted" });
    fetchHackathons();
  };

  const startEdit = (h: Hackathon) => {
    setForm({
      title: h.title, description: h.description || "", short_description: h.short_description || "",
      start_date: h.start_date?.slice(0, 16) || "", end_date: h.end_date?.slice(0, 16) || "",
      registration_deadline: h.registration_deadline?.slice(0, 16) || "",
      max_team_size: h.max_team_size, min_team_size: h.min_team_size,
      prizes: h.prizes || "", rules: h.rules || "",
      themes: (h.themes || []).join(", "), status: h.status, banner_url: h.banner_url || "",
    });
    setEditId(h.id); setShowForm(true);
  };

  const submitScore = async () => {
    if (!scoreForm.submissionId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Upsert score
    const { error } = await supabase.from("hackathon_scores").upsert({
      submission_id: scoreForm.submissionId, judge_id: user.id,
      innovation_score: scoreForm.innovation, technical_score: scoreForm.technical,
      design_score: scoreForm.design, presentation_score: scoreForm.presentation,
      comments: scoreForm.comments || null,
    }, { onConflict: "submission_id,judge_id" });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Score saved!" });
    setScoreForm({ submissionId: "", innovation: 0, technical: 0, design: 0, presentation: 0, comments: "" });
    if (judgingHackathon) fetchSubmissions(judgingHackathon);
  };

  return (
    <div className="space-y-6">
      {!judgingHackathon && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Hackathons</h2>
            <Button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
          </div>

          {showForm && (
            <div className="p-6 rounded-lg border border-border bg-card space-y-3">
              <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input placeholder="Short description" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
              <Textarea placeholder="Full description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className="text-xs text-muted-foreground">Start Date</label><Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><label className="text-xs text-muted-foreground">End Date</label><Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div><label className="text-xs text-muted-foreground">Registration Deadline</label><Input type="datetime-local" value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} /></div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground">Min Team</label><Input type="number" value={form.min_team_size} onChange={(e) => setForm({ ...form, min_team_size: +e.target.value })} /></div>
                <div><label className="text-xs text-muted-foreground">Max Team</label><Input type="number" value={form.max_team_size} onChange={(e) => setForm({ ...form, max_team_size: +e.target.value })} /></div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="judging">Judging</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <Input placeholder="Themes (comma-separated)" value={form.themes} onChange={(e) => setForm({ ...form, themes: e.target.value })} />
              <Input placeholder="Banner image URL" value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} />
              <Textarea placeholder="Prizes" value={form.prizes} onChange={(e) => setForm({ ...form, prizes: e.target.value })} />
              <Textarea placeholder="Rules" value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={save} disabled={!form.title || !form.start_date || !form.end_date}>{editId ? "Update" : "Create"}</Button>
                <Button variant="ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {hackathons.map((h) => (
              <div key={h.id} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{h.title}</h3>
                    <Badge variant="outline" className="capitalize text-xs">{h.status}</Badge>
                    {!h.is_published && <Badge variant="secondary" className="text-xs">Draft</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{h.short_description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => togglePublish(h.id, h.is_published || false)} title={h.is_published ? "Unpublish" : "Publish"}>
                    {h.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setJudgingHackathon(h.id); fetchSubmissions(h.id); }} title="Judge submissions">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(h)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteHackathon(h.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Judging Panel */}
      {judgingHackathon && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setJudgingHackathon(null)}>← Back</Button>
            <h2 className="text-xl font-semibold">Judge Submissions</h2>
          </div>

          {submissions.length === 0 ? (
            <p className="text-muted-foreground">No submissions to judge.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((s) => {
                const avgTotal = s.scores.length > 0
                  ? s.scores.reduce((sum, sc) => sum + sc.innovation_score + sc.technical_score + sc.design_score + sc.presentation_score, 0) / s.scores.length
                  : 0;
                return (
                  <div key={s.id} className="p-5 rounded-lg border border-border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{s.project_name}</h3>
                        <p className="text-sm text-muted-foreground">by {s.team?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{s.scores.length} judge(s)</p>
                        <p className="text-lg font-bold">{avgTotal.toFixed(1)}</p>
                      </div>
                    </div>
                    {scoreForm.submissionId === s.id ? (
                      <div className="space-y-3 border-t border-border pt-3 mt-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {(["innovation", "technical", "design", "presentation"] as const).map((cat) => (
                            <div key={cat}>
                              <label className="text-xs text-muted-foreground capitalize">{cat} (0–10)</label>
                              <Input type="number" min={0} max={10} value={scoreForm[cat]}
                                onChange={(e) => setScoreForm({ ...scoreForm, [cat]: +e.target.value })} />
                            </div>
                          ))}
                        </div>
                        <Textarea placeholder="Comments (optional)" value={scoreForm.comments}
                          onChange={(e) => setScoreForm({ ...scoreForm, comments: e.target.value })} />
                        <div className="flex gap-2">
                          <Button onClick={submitScore} size="sm">Save Score</Button>
                          <Button variant="ghost" size="sm" onClick={() => setScoreForm({ submissionId: "", innovation: 0, technical: 0, design: 0, presentation: 0, comments: "" })}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1 mt-2"
                        onClick={() => setScoreForm({ submissionId: s.id, innovation: 0, technical: 0, design: 0, presentation: 0, comments: "" })}>
                        <Star className="h-3.5 w-3.5" /> Score
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
