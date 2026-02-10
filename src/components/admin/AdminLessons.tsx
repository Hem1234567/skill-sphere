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

type Lesson = Tables<"lessons">;
type Course = Tables<"courses">;

const emptyForm = { title: "", course_id: "", module_name: "", video_url: "", content: "", lesson_order: "1" };

export default function AdminLessons() {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    const [l, c] = await Promise.all([
      supabase.from("lessons").select("*").order("lesson_order"),
      supabase.from("courses").select("*").order("title"),
    ]);
    setLessons((l.data as Lesson[]) || []);
    setCourses((c.data as Course[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (l: Lesson) => {
    setEditingId(l.id);
    setForm({
      title: l.title,
      course_id: l.course_id,
      module_name: l.module_name || "",
      video_url: l.video_url || "",
      content: l.content || "",
      lesson_order: String(l.lesson_order || 1),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.course_id) {
      toast({ title: "Title and course are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      course_id: form.course_id,
      module_name: form.module_name.trim() || null,
      video_url: form.video_url.trim() || null,
      content: form.content.trim() || null,
      lesson_order: parseInt(form.lesson_order) || 1,
    };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("lessons").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("lessons").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Error saving lesson", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Lesson updated" : "Lesson created" });
      setDialogOpen(false);
      fetch();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Lesson deleted" }); fetch(); }
  };

  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Lessons</h2>
        <Button size="sm" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Add Lesson</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Lesson" : "New Lesson"}</DialogTitle></DialogHeader>
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
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Module Name</Label><Input value={form.module_name} onChange={(e) => setForm({ ...form, module_name: e.target.value })} /></div>
              <div><Label>Order</Label><Input type="number" value={form.lesson_order} onChange={(e) => setForm({ ...form, lesson_order: e.target.value })} /></div>
            </div>
            <div><Label>Video URL</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/embed/..." /></div>
            <div><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-md border border-border bg-card animate-pulse" />)}</div>
      ) : lessons.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No lessons yet.</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Course</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Module</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Order</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{l.title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{courseMap[l.course_id] || "—"}</td>
                  <td className="px-4 py-3 text-sm hidden sm:table-cell">{l.module_name || "—"}</td>
                  <td className="px-4 py-3 text-center text-sm">{l.lesson_order}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id)}><Trash2 className="h-4 w-4" /></Button>
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
