import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Quiz = Tables<"quizzes">;
type Course = Tables<"courses">;

const emptyForm = { course_id: "", module_name: "", question: "", options: "", answer: "", marks: "1" };

export default function AdminQuizzes() {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const [q, c] = await Promise.all([
      supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("*").order("title"),
    ]);
    setQuizzes((q.data as Quiz[]) || []);
    setCourses((c.data as Course[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (q: Quiz) => {
    setEditingId(q.id);
    setForm({
      course_id: q.course_id,
      module_name: q.module_name || "",
      question: q.question,
      options: (q.options || []).join("\n"),
      answer: q.answer,
      marks: String(q.marks || 1),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const opts = form.options.split("\n").map((o) => o.trim()).filter(Boolean);
    if (!form.question.trim() || !form.course_id || opts.length < 2 || !form.answer.trim()) {
      toast({ title: "Fill question, course, at least 2 options, and answer", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      course_id: form.course_id,
      module_name: form.module_name.trim() || null,
      question: form.question.trim(),
      options: opts,
      answer: form.answer.trim(),
      marks: parseInt(form.marks) || 1,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("quizzes").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("quizzes").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Error saving quiz", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Quiz updated" : "Quiz created" });
      setDialogOpen(false);
      fetch();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quiz question?")) return;
    const { error } = await supabase.from("quizzes").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Quiz deleted" }); fetch(); }
  };

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Quizzes</h2>
        <Button size="sm" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Add Quiz</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Quiz" : "New Quiz"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Course *</Label>
              <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Module Name</Label><Input value={form.module_name} onChange={(e) => setForm({ ...form, module_name: e.target.value })} /></div>
            <div><Label>Question *</Label><Textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} rows={2} /></div>
            <div><Label>Options (one per line) *</Label><Textarea value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} rows={4} placeholder={"Option A\nOption B\nOption C\nOption D"} /></div>
            <div><Label>Correct Answer *</Label><Input value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Must match one of the options exactly" /></div>
            <div><Label>Marks</Label><Input type="number" value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-md border border-border bg-card animate-pulse" />)}</div>
      ) : quizzes.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No quizzes yet.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Question</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Course</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Answer</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Marks</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{q.question}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{courseMap[q.course_id] || "—"}</td>
                  <td className="px-4 py-3 text-sm hidden sm:table-cell">{q.answer}</td>
                  <td className="px-4 py-3 text-center text-sm">{q.marks}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(q)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4" /></Button>
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
