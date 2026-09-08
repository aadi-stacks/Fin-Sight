import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { LoadingState } from '../ui/LoadingState';
import { ErrorState } from '../ui/ErrorState';
import { Transaction, FinancialAccount } from '../../types/financial';
import {
  compileVerifiedFacts,
  fetchAIExplanation,
  AIExplanationResponse,
} from '../../services/aiExplanationService';
import {
  Bot,
  Code,
  Send,
  Info,
  CheckCircle2,
} from 'lucide-react';

export interface AIExplanationWidgetProps {
  transactions: Transaction[];
  accounts: FinancialAccount[];
}

const PRESET_QUESTIONS = [
  'Summarize my financial month.',
  'Why did my spending increase this month?',
  'Where did I spend the most?',
  'What changed compared with last month?',
  'What were my biggest spending changes?',
];

export const AIExplanationWidget: React.FC<AIExplanationWidgetProps> = ({
  transactions,
  accounts,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [activeQuestion, setActiveQuestion] = useState(PRESET_QUESTIONS[0]);

  const [response, setResponse] = useState<AIExplanationResponse | null>(null);
  const [showFactsDrawer, setShowFactsDrawer] = useState(false);

  const handleQueryAI = useCallback(
    async (questionText: string) => {
      setLoading(true);
      setError(null);
      setActiveQuestion(questionText);
      try {
        const facts = compileVerifiedFacts(transactions, accounts);
        const res = await fetchAIExplanation(facts, questionText);
        setResponse(res);
      } catch (err: any) {
        console.error('Failed to query AI explanation:', err);
        setError('Failed to contact AI explanation service.');
      } finally {
        setLoading(false);
      }
    },
    [transactions, accounts]
  );

  useEffect(() => {
    if (transactions.length > 0 || accounts.length > 0) {
      handleQueryAI(PRESET_QUESTIONS[0]);
    }
  }, [transactions, accounts, handleQueryAI]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    handleQueryAI(customQuestion.trim());
    setCustomQuestion('');
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950/30 border-brand-500/30 space-y-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-500/10 text-brand-400 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>AI Financial Assistant</span>
                <Badge variant={response?.isFallback ? 'neutral' : 'success'}>
                  {response?.isFallback ? 'Deterministic Verified Summary' : 'Gemini AI Explanation'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Natural language explanations grounded strictly in your pre-calculated application data
              </CardDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFactsDrawer(!showFactsDrawer)}
            leftIcon={<Code className="w-3.5 h-3.5" />}
            className="text-xs text-slate-400 hover:text-slate-200 shrink-0"
          >
            {showFactsDrawer ? 'Hide Verified Facts JSON' : 'Inspect Verified Facts Payload'}
          </Button>
        </div>
      </CardHeader>

      {/* Preset Question Buttons */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Suggested Questions</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleQueryAI(q)}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeQuestion === q
                  ? 'bg-brand-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-950/80 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* AI Explanation Content Output */}
      {loading ? (
        <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-xl">
          <LoadingState label="Grounded in verified application facts... Requesting AI explanation..." size="md" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={() => handleQueryAI(activeQuestion)} />
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="font-semibold text-brand-300">&ldquo;{activeQuestion}&rdquo;</span>
              <span className="text-[10px] text-slate-500">Zero Math Hallucination Enforced</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed pt-1">
              {response?.explanation || 'Select a question to generate a verified explanation.'}
            </p>
          </div>

          {/* Verified Facts Payload Drawer */}
          {showFactsDrawer && response?.verifiedFacts && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Pre-Calculated Application Facts JSON
                </span>
                <span className="text-[10px] text-slate-500">Passed to Backend Express Endpoint</span>
              </div>
              <pre className="p-3 bg-slate-900 text-brand-300 rounded-lg overflow-x-auto text-[11px] font-mono leading-tight">
                {JSON.stringify(response.verifiedFacts, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Custom Question Input Form */}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-2">
        <Input
          placeholder="Ask a custom question about your financial month..."
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={loading}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          Ask AI
        </Button>
      </form>

      {/* Non-Advice Financial Safety Disclaimer Banner */}
      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>AI Safety Disclaimer:</strong> This is an informational summary based on your verified recorded data and is not financial advice. AI models do not compute numbers or issue financial recommendations.
        </p>
      </div>
    </Card>
  );
};
