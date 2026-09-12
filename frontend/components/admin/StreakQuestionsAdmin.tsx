'use client';

import { useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Snowflake } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStreakQuestions } from '@/hooks/admin/useAdminStreakQuestions';
import { useAdminCreateStreakQuestion } from '@/hooks/admin/useAdminCreateStreakQuestion';
import { useAdminUpdateStreakQuestion } from '@/hooks/admin/useAdminUpdateStreakQuestion';
import { useAdminDeleteStreakQuestion } from '@/hooks/admin/useAdminDeleteStreakQuestion';
import { Button } from '@/components/ui/button';
import type { StreakQuestionDto, CreateStreakQuestionDto } from '@/sdk';

const EMPTY_FORM: CreateStreakQuestionDto = {
  question: '',
  options: ['', '', '', ''],
  correctAnswerIndex: 0,
  category: 'general',
  context: '',
};

export function StreakQuestionsAdmin() {
  const { data: questions, isLoading, error } = useAdminStreakQuestions();
  const createMutation = useAdminCreateStreakQuestion();
  const updateMutation = useAdminUpdateStreakQuestion();
  const deleteMutation = useAdminDeleteStreakQuestion();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StreakQuestionDto | null>(null);
  const [form, setForm] = useState<CreateStreakQuestionDto>({ ...EMPTY_FORM });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || form.options.some((o) => !o.trim())) {
      toast.error('Question and all 4 options are required');
      return;
    }
    try {
      await createMutation.mutateAsync(form);
      toast.success('Question created');
      setCreateOpen(false);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create');
    }
  };

  const openEdit = (q: StreakQuestionDto) => {
    setEditing(q);
    setForm({
      question: q.question,
      options: [...q.options],
      correctAnswerIndex: q.correctAnswerIndex,
      category: q.category,
      context: q.context ?? '',
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, dto: form });
      toast.success('Question updated');
      setEditing(null);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this question?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Question deactivated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const updateOption = (idx: number, value: string) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[idx] = value;
      return { ...prev, options };
    });
  };

  const formUI = (
    <form onSubmit={editing ? handleEdit : handleCreate} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-fg/80 mb-1">
          Question
        </label>
        <input
          type="text"
          value={form.question}
          onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
          className="w-full rounded-lg border border-fg/20 bg-fg/5 px-3 py-2 text-fg placeholder-fg/40 focus:border-spotify-green focus:outline-none focus:ring-1 focus:ring-spotify-green"
          placeholder="What's the inside joke question?"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-fg/80">
          Options (select correct answer)
        </label>
        {form.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, correctAnswerIndex: idx }))
              }
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                form.correctAnswerIndex === idx
                  ? 'bg-spotify-green/20 border-spotify-green text-spotify-green'
                  : 'border-fg/20 text-fg/40 hover:border-fg/40'
              }`}
            >
              {String.fromCharCode(65 + idx)}
            </button>
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(idx, e.target.value)}
              className="flex-1 rounded-lg border border-fg/20 bg-fg/5 px-3 py-2 text-fg text-sm placeholder-fg/40 focus:border-spotify-green focus:outline-none focus:ring-1 focus:ring-spotify-green"
              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
              required
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-fg/80 mb-1">
            Category
          </label>
          <input
            type="text"
            value={form.category ?? ''}
            onChange={(e) =>
              setForm((p) => ({ ...p, category: e.target.value }))
            }
            className="w-full rounded-lg border border-fg/20 bg-fg/5 px-3 py-2 text-fg text-sm placeholder-fg/40 focus:border-spotify-green focus:outline-none focus:ring-1 focus:ring-spotify-green"
            placeholder="e.g. classic-moments"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fg/80 mb-1">
            Context (private note)
          </label>
          <input
            type="text"
            value={form.context ?? ''}
            onChange={(e) =>
              setForm((p) => ({ ...p, context: e.target.value }))
            }
            className="w-full rounded-lg border border-fg/20 bg-fg/5 px-3 py-2 text-fg text-sm placeholder-fg/40 focus:border-spotify-green focus:outline-none focus:ring-1 focus:ring-spotify-green"
            placeholder="Inside joke context"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCreateOpen(false);
            setEditing(null);
            setForm({ ...EMPTY_FORM });
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="spotify"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : editing ? (
            'Save'
          ) : (
            'Create'
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Snowflake className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-fg">
            Streak Quiz Questions
          </h2>
        </div>
        {!createOpen && !editing && (
          <Button
            variant="spotify"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-full"
          >
            <Plus className="w-4 h-4" /> Add Question
          </Button>
        )}
      </div>

      {(createOpen || editing) && (
        <div className="mb-6 p-4 rounded-xl border border-fg/10 bg-fg/5">
          <h3 className="text-sm font-medium text-fg/70 mb-3">
            {editing ? 'Edit Question' : 'New Question'}
          </h3>
          {formUI}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-spotify-green animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3">
          Failed to load streak questions.
        </div>
      )}

      {!isLoading && !error && questions && (
        <div className="space-y-2">
          {questions.length === 0 ? (
            <p className="text-center text-fg/50 py-8">
              No questions yet. Add some inside jokes!
            </p>
          ) : (
            questions.map((q) => (
              <div
                key={q.id}
                className={`p-4 rounded-xl border ${
                  q.isActive
                    ? 'border-fg/10 bg-fg/5'
                    : 'border-fg/5 bg-fg/2 opacity-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-fg font-medium text-sm">{q.question}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {q.options.map((opt, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-1 rounded ${
                            idx === q.correctAnswerIndex
                              ? 'bg-green-400/15 text-green-400 border border-green-400/20'
                              : 'bg-fg/5 text-fg/60 border border-fg/10'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}: {opt}
                        </span>
                      ))}
                    </div>
                    {q.context && (
                      <p className="mt-1.5 text-xs text-fg/40 italic">
                        {q.context}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs text-fg/30 bg-fg/5 px-2 py-0.5 rounded">
                        {q.category}
                      </span>
                      {!q.isActive && (
                        <span className="text-xs text-red-400/80 bg-red-400/10 px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(q)}
                      className="text-fg/60 hover:text-fg"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    {q.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(q.id)}
                        className="text-red-400/70 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
