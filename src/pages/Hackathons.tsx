import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Calendar, Users, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Hackathon {
  id: string;
  title: string;
  short_description: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  max_team_size: number;
  themes: string[] | null;
  status: string;
  banner_url: string | null;
}

function getStatusColor(status: string) {
  switch (status) {
    case "upcoming": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "active": return "bg-green-500/10 text-green-500 border-green-500/20";
    case "judging": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "completed": return "bg-muted text-muted-foreground border-border";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

export default function Hackathons() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("hackathons")
      .select("id, title, short_description, start_date, end_date, registration_deadline, max_team_size, themes, status, banner_url")
      .eq("is_published", true)
      .order("start_date", { ascending: false })
      .then(({ data }) => {
        setHackathons((data as Hackathon[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading hackathons...</div>;
  }

  if (hackathons.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Hackathons</h1>
          <p className="text-muted-foreground">No hackathons available yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Hackathons</h1>
        <p className="text-muted-foreground">Register teams, submit projects, and compete.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {hackathons.map((h) => (
          <Link
            key={h.id}
            to={`/hackathons/${h.id}`}
            className="group rounded-lg border border-border bg-card hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            {h.banner_url && (
              <div className="h-40 bg-muted overflow-hidden">
                <img src={h.banner_url} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border capitalize ${getStatusColor(h.status)}`}>
                  {h.status}
                </span>
                {h.themes?.slice(0, 2).map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{h.title}</h2>
              {h.short_description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{h.short_description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(h.start_date), "MMM d")} – {format(new Date(h.end_date), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Up to {h.max_team_size} per team
                </span>
                {h.registration_deadline && new Date(h.registration_deadline) > new Date() && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Register by {format(new Date(h.registration_deadline), "MMM d")}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
