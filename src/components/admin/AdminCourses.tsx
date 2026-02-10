import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Course = Tables<"courses">;

const emptyForm = {
  title: "",
  description: "",
  category: "",
  difficulty: "Beginner",
  tags: "",
  estimated_duration: "",
  is_published: false,
  is_featured: false,
};

export default function AdminCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setCourses((data as Course[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditingId(c.id);
    setForm({
      title: c.title,
      description: c.description || "",
      category: c.category || "",
      difficulty: c.difficulty || "Beginner",
      tags: (c.tags || []).join(", "),
      estimated_duration: c.estimated_duration || "",
      is_published: c.is_published || false,
      is_featured: c.is_featured || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Title is required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      difficulty: form.difficulty,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      estimated_duration: form.estimated_duration.trim() || null,
      is_published: form.is_published,
      is_featured: form.is_featured,
      created_by: user?.id || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("courses").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("courses").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Error saving course", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Course updated" : "Course created" });
      setDialogOpen(false);
      fetchCourses();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Course deleted" });
      fetchCourses();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Courses</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" />Add Course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Course" : "New Course"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div>
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="JavaScript, Frontend" /></div>
              <div><Label>Estimated Duration</Label><Input value={form.estimated_duration} onChange={(e) => setForm({ ...form, estimated_duration: e.target.value })} placeholder="4 weeks" /></div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><Label>Featured</Label></div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-md border border-border bg-card animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No courses yet. Create one!</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">Difficulty</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Published</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{c.category || "—"}</td>
                  <td className="px-4 py-3 text-sm hidden sm:table-cell">{c.difficulty}</td>
                  <td className="px-4 py-3 text-center">{c.is_published ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
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
