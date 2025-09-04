import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/hooks/useRedux";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

import config from "../config/default.json";
import {getAllTickets} from "../api/jiraLogTime.js";

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
  inputText?: string; // temp user input for time field
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

// Parse user input like "1h 30m", "90m", "1.5h", "90"
const parseTimeInput = (input: string): number => {
  if (!input) return 0;
  const str = input.trim().toLowerCase().replace(/\s+/g, " ");
  // direct minutes number
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  // 1.5h or 1.25h forms
  const mHourDecimal = str.match(/^(\d+(?:\.\d+)?)h$/);
  if (mHourDecimal) return Math.round(parseFloat(mHourDecimal[1]) * 60);
  // h and m mixed, in any order
  let total = 0;
  const hMatch = str.match(/(\d+(?:\.\d+)?)\s*h/);
  const mMatch = str.match(/(\d+)\s*m/);
  if (hMatch) total += Math.round(parseFloat(hMatch[1]) * 60);
  if (mMatch) total += parseInt(mMatch[1], 10);
  if (total > 0) return total;
  return 0;
};

const minutesToInputString = (mins: number): string => formatMinutes(mins);

const LogTime = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userData } = useAppSelector((s) => s.auth);
  const displayName = (userData as any)?.displayName || "User";
  const username = (userData as any)?.name || "";

  useEffect(() => {
    document.title = "Log Time | Jira Helper";
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ["userTickets", username],
    enabled: Boolean(username),
    queryFn: () => getAllTickets(username),
  });

  // Manage log state per subtask id
  const [logMap, setLogMap] = useState<Record<string, LogState>>({});
  const adjustTime = (subtaskId: string, deltaMin: number) => {
    setLogMap((prev) => {
      const current = prev[subtaskId] || { minutes: 0, description: "" };
      const minutes = Math.max(0, (current.minutes || 0) + deltaMin);
      return { ...prev, [subtaskId]: { ...current, minutes, inputText: undefined } };
    });
  };
  const setDescription = (subtaskId: string, description: string) => {
    setLogMap((prev) => ({ ...prev, [subtaskId]: { ...(prev[subtaskId] || { minutes: 0, description: "" }), description } }));
  };
  const setTimeText = (subtaskId: string, inputText: string) => {
    setLogMap((prev) => {
      const current = prev[subtaskId] || { minutes: 0, description: "" };
      return { ...prev, [subtaskId]: { ...current, inputText } };
    });
  };
  const commitTimeText = (subtaskId: string) => {
    setLogMap((prev) => {
      const current = prev[subtaskId] || { minutes: 0, description: "" };
      const parsed = parseTimeInput(current.inputText || "");
      const minutes = Math.max(0, isNaN(parsed) ? current.minutes || 0 : parsed);
      const inputText = minutesToInputString(minutes);
      return { ...prev, [subtaskId]: { ...current, minutes, inputText } };
    });
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
              <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-6">
                {(data?.issues || []).map((issue) => (
                  <section key={issue.parent.id} className="rounded-md border bg-card">
                    <div className="p-4 border-b flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">{issue.parent.summary}</h2>
                        <a
                          className="text-sm text-primary underline underline-offset-4"
                          href={`https://jira.grazitti.com/browse/${issue.parent.key}`}
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
                                    href={`https://jira.grazitti.com/browse/${st.key}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {st.key}
                                  </a>
                                </TableCell>
                                <TableCell className="text-foreground">{st.summary}</TableCell>
                                <TableCell>{renderStatus(st.status)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => adjustTime(st.id, -15)}>-15m</Button>
                                    <Input
                                      className="w-28 text-center"
                                      placeholder="0m"
                                      value={logMap[st.id]?.inputText ?? minutesToInputString(logMap[st.id]?.minutes || 0)}
                                      onChange={(e) => setTimeText(st.id, e.target.value)}
                                      onBlur={() => commitTimeText(st.id)}
                                      onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } }}
                                    />
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
              </div>

              <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-md border bg-card">
                <div className="flex items-center gap-4">
                  <div className="w-44 text-sm sm:text-base">
                    Total Logged: <span className="font-semibold">{formatMinutes(totalMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-[200px]">
                    <Progress 
                      value={Math.min((totalMinutes / 480) * 100, 100)} 
                      className={`h-3 transition-all duration-300 ${totalMinutes >= 480 ? 'animate-bounce' : ''}`}
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">/ 8h</span>
                  </div>
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
