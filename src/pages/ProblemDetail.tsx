import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Editor from "@monaco-editor/react";
import { Send, Clock, HardDrive } from "lucide-react";

interface Problem {
  id: string;
  title: string;
  statement: string;
  constraints: string | null;
  difficulty: string | null;
  tags: string[] | null;
  sample_input: string | null;
  sample_output: string | null;
  points: number | null;
  time_limit: string | null;
  memory_limit: string | null;
}

const languageDefaults: Record<string, string> = {
  javascript: "// Write your solution here\nfunction solution() {\n  \n}\n",
  python: "# Write your solution here\ndef solution():\n    pass\n",
  java: "// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n",
  cpp: "// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n",
  c: "// Write your solution here\n#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n",
};

const difficultyColor: Record<string, string> = {
  Easy: "text-easy",
  Medium: "text-medium",
  Hard: "text-hard",
};

export default function ProblemDetail() {
  const { problemId } = useParams<{ problemId: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(languageDefaults.javascript);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!problemId) return;
    supabase
      .from("problems")
      .select("*")
      .eq("id", problemId)
      .maybeSingle()
      .then(({ data }) => {
        setProblem(data as Problem | null);
        setLoading(false);
      });
  }, [problemId]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(languageDefaults[lang] || "");
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to submit solutions.", variant: "destructive" });
      return;
    }
    if (!problem) return;
    setSubmitting(true);
    const { error } = await supabase.from("submissions").insert({
      user_id: user.id,
      problem_id: problem.id,
      language,
      code,
      status: "Submitted",
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Solution submitted!", description: "Your solution has been recorded." });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-4" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-semibold">Problem not found</h2>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row">
      {/* Problem description panel */}
      <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border overflow-y-auto p-6">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold">{problem.title}</h1>
            <span className={`text-sm font-semibold ${difficultyColor[problem.difficulty || "Easy"]}`}>
              {problem.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{problem.time_limit}</span>
            <span className="flex items-center gap-1"><HardDrive className="h-3.5 w-3.5" />{problem.memory_limit}</span>
            <span>{problem.points} pts</span>
          </div>

          {problem.tags && problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-6">
              {problem.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Problem Statement</h3>
            <p className="whitespace-pre-wrap">{problem.statement}</p>
          </div>

          {problem.constraints && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Constraints</h3>
              <p className="text-sm font-mono bg-muted p-3 rounded-md whitespace-pre-wrap">{problem.constraints}</p>
            </div>
          )}

          {problem.sample_input && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sample Input</h3>
                <pre className="text-sm font-mono bg-muted p-3 rounded-md overflow-x-auto">{problem.sample_input}</pre>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sample Output</h3>
                <pre className="text-sm font-mono bg-muted p-3 rounded-md overflow-x-auto">{problem.sample_output}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor panel */}
      <div className="lg:w-1/2 flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="c">C</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSubmit} disabled={submitting} size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            language={language === "cpp" ? "cpp" : language === "c" ? "c" : language}
            value={code}
            onChange={(value) => setCode(value || "")}
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16 },
            }}
          />
        </div>
      </div>
    </div>
  );
}
