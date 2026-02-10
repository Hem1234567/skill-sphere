import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Problem = Tables<"problems">;

const difficultyColor: Record<string, string> = {
  Easy: "text-easy",
  Medium: "text-medium",
  Hard: "text-hard",
};

const emptyForm = {
  title: "",
  statement: "",
  constraints: "",
  difficulty: "Easy",
  tags: "",
  sample_input: "",
  sample_output: "",
  points: "10",
  time_limit: "1s",
  memory_limit: "256MB",
  is_published: false,
};

export default function AdminProblems() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchProblems = async () => {
    const { data } = await supabase.from("problems").select("*").order("created_at", { ascending: false });
    setProblems((data as Problem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProblems(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Problem) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      statement: p.statement,
      constraints: p.constraints || "",
      difficulty: p.difficulty || "Easy",
      tags: (p.tags || []).join(", "),
      sample_input: p.sample_input || "",
      sample_output: p.sample_output || "",
      points: String(p.points || 10),
      time_limit: p.time_limit || "1s",
      memory_limit: p.memory_limit || "256MB",
      is_published: p.is_published || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.statement.trim()) {
      toast({ title: "Title and statement are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      statement: form.statement.trim(),
      constraints: form.constraints.trim() || null,
      difficulty: form.difficulty,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      sample_input: form.sample_input.trim() || null,
      sample_output: form.sample_output.trim() || null,
      points: parseInt(form.points) || 10,
      time_limit: form.time_limit.trim() || "1s",
      memory_limit: form.memory_limit.trim() || "256MB",
      is_published: form.is_published,
      created_by: user?.id || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("problems").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("problems").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Error saving problem", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Problem updated" : "Problem created" });
      setDialogOpen(false);
      fetchProblems();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this problem?")) return;
    const { error } = await supabase.from("problems").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Problem deleted" });
      fetchProblems();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Problems</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Add Problem</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Problem" : "New Problem"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Problem Statement *</Label><Textarea value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} rows={4} /></div>
              <div><Label>Constraints</Label><Textarea value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Points</Label><Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} /></div>
              </div>
              <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Array, HashMap" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Sample Input</Label><Textarea value={form.sample_input} onChange={(e) => setForm({ ...form, sample_input: e.target.value })} rows={2} /></div>
                <div><Label>Sample Output</Label><Textarea value={form.sample_output} onChange={(e) => setForm({ ...form, sample_output: e.target.value })} rows={2} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Time Limit</Label><Input value={form.time_limit} onChange={(e) => setForm({ ...form, time_limit: e.target.value })} /></div>
                <div><Label>Memory Limit</Label><Input value={form.memory_limit} onChange={(e) => setForm({ ...form, memory_limit: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-md border border-border bg-card animate-pulse" />)}</div>
      ) : problems.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No problems yet. Create one!</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Difficulty</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Tags</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Published</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className={`px-4 py-3 text-sm font-medium hidden sm:table-cell ${difficultyColor[p.difficulty || "Easy"]}`}>{p.difficulty}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {p.tags?.slice(0, 3).map((tag) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{p.is_published ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
