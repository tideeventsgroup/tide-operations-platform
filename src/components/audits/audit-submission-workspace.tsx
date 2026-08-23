"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { answerAuditQuestionAction, submitAuditAction } from "@/lib/actions/audits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChoiceCard } from "@/components/ui/choice-card";
import type { Enums, Tables } from "@/lib/supabase/types";

type Question = Tables<"audit_template_questions">;
type Answer = Tables<"audit_answers">;
type Response = Enums<"audit_response">;

const RESPONSE_LABEL: Record<Response, string> = { pass: "Pass", fail: "Fail", not_applicable: "N/A" };
const RESPONSE_CLASS: Record<Response, string> = {
  pass: "bg-success-bg text-success",
  fail: "bg-destructive/10 text-destructive",
  not_applicable: "bg-muted text-muted-foreground",
};
const RESPONSE_TONE: Record<Response, "success" | "destructive" | "neutral"> = {
  pass: "success",
  fail: "destructive",
  not_applicable: "neutral",
};

function groupBySection(questions: Question[]) {
  const groups = new Map<string, Question[]>();
  for (const q of questions) {
    const key = q.section ?? "General";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(q);
  }
  return Array.from(groups.entries());
}

export function AuditSubmissionWorkspace({
  submissionId,
  questions,
  initialAnswers,
  isDraft,
}: {
  submissionId: string;
  questions: Question[];
  initialAnswers: Map<string, Answer>;
  isDraft: boolean;
}) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const sections = groupBySection(questions);
  const allAnswered = questions.every((q) => answers.has(q.id));

  function answer(question: Question, response: Response) {
    startTransition(async () => {
      const notes = notesDraft[question.id];
      const result = await answerAuditQuestionAction(submissionId, question.id, response, notes);
      if (result.error) toast.error(result.error);
      else {
        setAnswers((prev) => {
          const next = new Map(prev);
          next.set(question.id, { id: "", submission_id: submissionId, question_id: question.id, response, notes: notes ?? null, answered_at: new Date().toISOString() });
          return next;
        });
      }
    });
  }

  function submit() {
    startTransition(async () => {
      const result = await submitAuditAction(submissionId);
      if (result.error) toast.error(result.error);
      else toast.success("Audit submitted");
    });
  }

  return (
    <div className="space-y-6">
      {sections.map(([section, sectionQuestions]) => (
        <div key={section} className="space-y-3">
          <h2 className="section-label">{section}</h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {sectionQuestions.map((q) => {
              const current = answers.get(q.id);
              return (
                <div key={q.id} className="space-y-2 px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">{q.question_text}</p>
                  {isDraft ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {(["pass", "fail", "not_applicable"] as Response[]).map((r) => (
                        <ChoiceCard
                          key={r}
                          label={RESPONSE_LABEL[r]}
                          selected={current?.response === r}
                          disabled={pending}
                          tone={RESPONSE_TONE[r]}
                          onClick={() => answer(q, r)}
                        />
                      ))}
                      <Input
                        placeholder="Notes (optional)"
                        defaultValue={current?.notes ?? ""}
                        onChange={(e) => setNotesDraft((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        className="h-8 max-w-xs flex-1"
                        disabled={pending}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {current ? (
                        <Badge variant="secondary" className={RESPONSE_CLASS[current.response]}>
                          {RESPONSE_LABEL[current.response]}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not answered</Badge>
                      )}
                      {current?.notes ? <span className="text-xs text-muted-foreground">{current.notes}</span> : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {isDraft ? (
        <Button disabled={pending || !allAnswered} onClick={submit}>
          {pending ? "Submitting…" : "Submit audit"}
        </Button>
      ) : null}
    </div>
  );
}
