import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/hooks/useRedux";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface ApiSubtask {
  id: string;
  key: string;
  summary: string;
  status: string;
}

interface ApiIssue {
  parent: {
    id: string;
    key: string;
    summary: string;
  };
  sprint: any;
  subtasks: ApiSubtask[];
}

interface ApiResponse {
  success: boolean;
  totalMainIssues: number;
  issues: ApiIssue[];
}

// Local state for logging time per subtask
interface LogState {
  minutes: number; // store minutes; display as "xh ym"
  description: string;
}

const statusOrder = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("work in progress") || s.includes("in progress") || s.includes("wip")) return 0;
  if (s.includes("open")) return 1;
  if (s.includes("completed") || s.includes("done")) return 2;
  return 3;
};

const formatMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (mins <= 0) return "0m";
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const LogTime = () => {
  const navigate = useNavigate();
  const { isLoggedIn, authToken, userData } = useAppSelector((s) => s.auth);
  const displayName = (userData as any)?.displayName || "User";
  const username = (userData as any)?.name || "";

  useEffect(() => {
    document.title = "Log Time | Jira Helper";
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !authToken) {
      navigate("/");
    }
  }, [isLoggedIn, authToken, navigate]);

  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ["userTickets", username],
    enabled: Boolean(username) && Boolean(authToken),
    queryFn: async () => {
      const token = authToken?.startsWith("Basic ") ? authToken : `Basic ${authToken}`;
      const res = await fetch("http://localhost:8081/userTickets/getAllTickets", {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName: username }),
      });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return res.json();
    },
  });

  // Manage log state per subtask id
  const [logMap, setLogMap] = useState<Record<string, LogState>>({});
  const adjustTime = (subtaskId: string, deltaMin: number) => {
    setLogMap((prev) => {
      const current = prev[subtaskId] || { minutes: 0, description: "" };
      const minutes = Math.max(0, current.minutes + deltaMin);
      return { ...prev, [subtaskId]: { ...current, minutes } };
    });
  };
  const setDescription = (subtaskId: string, description: string) => {
    setLogMap((prev) => ({ ...prev, [subtaskId]: { ...(prev[subtaskId] || { minutes: 0, description: "" }), description } }));
  };
  const resetAll = () => setLogMap({});

  const totalMinutes = useMemo(() => Object.values(logMap).reduce((sum, s) => sum + (s.minutes || 0), 0), [logMap]);

  const handleSubmit = () => {
    // Currently no API provided to submit time logs; expose the payload for integration
    const payload = (data?.issues || []).flatMap((issue) =>
      (issue.subtasks || []).map((st) => ({
        subtaskId: st.id,
        subtaskKey: st.key,
        minutes: logMap[st.id]?.minutes || 0,
        description: logMap[st.id]?.description || "",
      }))
    ).filter((p) => p.minutes > 0);

    console.log("Time log submit payload:", {
      username,
      totalMinutes,
      entries: payload,
    });
    alert(`Prepared ${payload.length} time log entrie(s) totaling ${formatMinutes(totalMinutes)}. Check console for payload.`);
  };

  const renderStatus = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("work in progress") || s.includes("in progress") || s.includes("wip")) {
      return <Badge className="bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 border-yellow-500/30">In Progress</Badge>;
    }
    if (s.includes("completed") || s.includes("done")) {
      return <Badge className="bg-green-500/20 text-green-800 dark:text-green-200 border-green-500/30">Completed</Badge>;
    }
    return <Badge variant="secondary">Open</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-background/95">
      <header className="bg-background border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    {displayName?.charAt(0) || "U"}
                  </div>
                </span>
              </div>
              <span className="ml-3 text-xl text-foreground">Log Time</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate("/configuration")}>Configuration</Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>Create Subtasks</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Log Time</h1>
            <p className="text-muted-foreground">View your issues and log time for subtasks</p>
          </div>

          {isLoading && <div className="text-muted-foreground">Loading tickets…</div>}
          {isError && <div className="text-destructive">Failed to load tickets. Please try again.</div>}

          {!isLoading && !isError && (
            <div className="space-y-6">
              {(data?.issues || []).map((issue) => (
                <section key={issue.parent.id} className="rounded-md border bg-card">
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{issue.parent.summary}</h2>
                      <a
                        className="text-sm text-primary underline underline-offset-4"
                        href={`https://google.com/${issue.parent.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {issue.parent.key}
                      </a>
                    </div>
                    <div className="text-sm text-muted-foreground">{(issue.subtasks || []).length} subtasks</div>
                  </div>

                  <div className="p-4 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Subtask</TableHead>
                          <TableHead>Summary</TableHead>
                          <TableHead className="min-w-[140px]">Status</TableHead>
                          <TableHead className="min-w-[180px]">Log Time</TableHead>
                          <TableHead className="min-w-[280px]">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...(issue.subtasks || [])]
                          .sort((a, b) => statusOrder(a.status) - statusOrder(b.status))
                          .map((st) => (
                            <TableRow key={st.id}>
                              <TableCell>
                                <a
                                  className="text-primary underline underline-offset-4 font-mono"
                                  href={`https://google.com/${st.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {st.id}
                                </a>
                              </TableCell>
                              <TableCell className="text-foreground">{st.summary}</TableCell>
                              <TableCell>{renderStatus(st.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => adjustTime(st.id, -15)}>-15m</Button>
                                  <div className="min-w-[64px] text-center font-medium">{formatMinutes(logMap[st.id]?.minutes || 0)}</div>
                                  <Button variant="outline" size="sm" onClick={() => adjustTime(st.id, 15)}>+15m</Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Textarea
                                  placeholder="Add description for this time log"
                                  value={logMap[st.id]?.description || ""}
                                  onChange={(e) => setDescription(st.id, e.target.value)}
                                  className="min-h-10"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              ))}

              <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-md border bg-card">
                <div className="text-sm sm:text-base">
                  Total Logged: <span className="font-semibold">{formatMinutes(totalMinutes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={resetAll}>Reset</Button>
                  <Button onClick={handleSubmit}>Submit</Button>
                </div>
              </footer>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LogTime;
