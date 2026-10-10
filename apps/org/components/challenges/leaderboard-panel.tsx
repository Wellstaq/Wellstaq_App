// path: components/challenges/leaderboard-panel.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Pencil, X } from "lucide-react";
import { api } from "@/services/api";
import { Input } from "@/components/ui/input";
import type { ChallengeLeaderboardEntry } from "@/types/api";

export function LeaderboardPanel({
  organizationId,
  challengeId,
  canEditScore,
}: {
  organizationId: string;
  challengeId: string;
  canEditScore: boolean;
}) {
  const [entries, setEntries] = useState<ChallengeLeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await api.organization.getChallengeLeaderboard(organizationId, challengeId, { limit: 50 });
      setEntries(res.items);
      setTotal(res.total);
    } catch {
      setEntries([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, challengeId]);

  const startEditing = (entry: ChallengeLeaderboardEntry) => {
    setEditingUserId(entry.userId);
    setScoreInput(entry.score !== null ? String(entry.score) : "");
  };

  const handleSaveScore = async (userId: string) => {
    const parsed = Number(scoreInput);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Score must be a number between 0 and 100.");
      return;
    }
    setIsSaving(true);
    try {
      await api.organization.updateChallengeParticipantScore(organizationId, challengeId, userId, { score: Math.round(parsed) });
      toast.success("Score updated");
      setEditingUserId(null);
      await load();
    } catch {
      // error toast handled globally
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[12px] border border-grey-4 p-3 sm:p-6">
      <h2 className="font-bold text-grey-1 mb-4">Leaderboard ({total})</h2>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-grey-5 rounded-xl animate-pulse" />)}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-grey-3 italic py-6 text-center">No ranked participants yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isEditing = editingUserId === entry.userId;
            return (
              <div key={entry.userId} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-transparent hover:bg-grey-5 hover:border-grey-4 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-grey-5 text-grey-2 shrink-0">
                    {entry.rank}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-grey-1 truncate">{entry.firstName} {entry.lastName}</p>
                    <p className="text-xs text-grey-3">
                      {entry.percentComplete}% complete{entry.completedAt ? " · Completed" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={scoreInput}
                        onChange={(e) => setScoreInput(e.target.value)}
                        className="h-9 w-20"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveScore(entry.userId)}
                        disabled={isSaving}
                        className="p-2 rounded-lg border border-grey-4 text-green-600 hover:border-green-600 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        className="p-2 rounded-lg border border-grey-4 text-grey-2 hover:text-red-500 hover:border-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-grey-1">
                        {entry.score !== null ? entry.score : entry.currentValue}
                      </span>
                      {canEditScore && (
                        <button
                          type="button"
                          onClick={() => startEditing(entry)}
                          className="p-2 rounded-lg border border-grey-4 text-grey-2 hover:text-primary-1 hover:border-primary-1"
                          title="Set score"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
