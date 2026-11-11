import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { QuestionItem } from '../types';
import { INITIAL_QUESTIONS } from '../data/seedData';
import { Modal } from '../components/Modal';
import { PaperSpeechBubble } from '../components/TornPaper';
import { MoonPhaseStrip } from '../components/MoonMotifs';
import { MessageSquare, Send, CheckCircle2, Clock, Trash2, Edit3, ShieldAlert } from 'lucide-react';

const COOLDOWN_KEY = 'archive_question_cooldown';
const COOLDOWN_SECONDS = 45;

export const QuestionsPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for visitors
  const [inputQuestion, setInputQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Owner answer modal states
  const [answeringQuestion, setAnsweringQuestion] = useState<QuestionItem | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);

  // Cooldown timer effect
  useEffect(() => {
    const checkCooldown = () => {
      const lastSent = localStorage.getItem(COOLDOWN_KEY);
      if (lastSent) {
        const elapsed = (Date.now() - parseInt(lastSent, 10)) / 1000;
        if (elapsed < COOLDOWN_SECONDS) {
          setCooldownRemaining(Math.ceil(COOLDOWN_SECONDS - elapsed));
        } else {
          setCooldownRemaining(0);
        }
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Owner reads all questions (including unanswered); visitors read only answered questions
    const q = isOwner
      ? collection(db, 'questions')
      : query(collection(db, 'questions'), where('answered', '==', true));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionItem));
          // Sort newest first
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setQuestions(list);
        } else {
          setQuestions(INITIAL_QUESTIONS);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'questions');
      }
    );

    return () => unsubscribe();
  }, [isOwner]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputQuestion.trim();
    if (!trimmed) return;
    if (trimmed.length > 50) {
      alert('질문은 50자 이내로 작성해주세요.');
      return;
    }
    if (cooldownRemaining > 0) {
      alert(`도배 방지를 위해 ${cooldownRemaining}초 후에 다시 질문하실 수 있습니다.`);
      return;
    }

    try {
      setSubmitting(true);
      const newId = `q-${Date.now()}`;
      const ref = doc(db, 'questions', newId);
      const newQ: QuestionItem = {
        id: newId,
        question: trimmed,
        answered: false,
        createdAt: new Date().toISOString(),
      };

      await setDoc(ref, newQ);
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
      setCooldownRemaining(COOLDOWN_SECONDS);
      setInputQuestion('');
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4000);
    } catch (err) {
      alert('질문 등록 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const openAnswerModal = (q: QuestionItem) => {
    setAnsweringQuestion(q);
    setAnswerText(q.answer || '');
    setIsAnswerModalOpen(true);
  };

  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringQuestion) return;

    try {
      setSavingAnswer(true);
      const ref = doc(db, 'questions', answeringQuestion.id);
      await updateDoc(ref, {
        answer: answerText.trim(),
        answered: true,
        answeredAt: new Date().toISOString(),
      });
      setIsAnswerModalOpen(false);
    } catch (err) {
      alert('답변 저장 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSavingAnswer(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 질문을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Split into answered vs unanswered (unanswered is only visible to owner)
  const answeredQuestions = questions.filter((q) => q.answered);
  const unansweredQuestions = questions.filter((q) => !q.answered);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Editorial Page Header: Location name only */}
      <div className="border-b border-[rgba(11,31,75,0.12)] pb-6 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-editorial text-sm tracking-widest text-[#2F5BEA] uppercase block mb-1">
            05 / Archive
          </span>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1F4B] tracking-tight">
            익명 질문함
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#0B1F4B]/60 font-light">
            로그인 없이 자유롭게 50자 이내의 질문을 남겨주세요. 주인이 확인 후 답변을 작성합니다.
          </p>
        </div>
        <MoonPhaseStrip size={14} className="text-[#1D3FBB] opacity-60 self-start sm:self-auto" />
      </div>

      {/* Visitor Question Input Form (Cream Paper Sheet with Subtle Fold Line) */}
      <form
        onSubmit={handleSubmitQuestion}
        className="paper-sheet p-5 sm:p-6 mb-12 shadow-sm relative paper-fold-line"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/75">
            새 질문 남기기
          </label>
          <span
            className={`text-xs font-mono font-medium ${
              inputQuestion.length === 50 ? 'text-red-500 font-bold' : 'text-[#0B1F4B]/50'
            }`}
          >
            {inputQuestion.length} / 50자
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            required
            maxLength={50}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value.slice(0, 50))}
            placeholder="50자 이내로 궁금한 점을 적어주세요..."
            disabled={submitting || cooldownRemaining > 0}
            className="w-full px-3.5 py-3 text-sm bg-white/70 border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:bg-white focus:outline-none transition-all placeholder:text-[#0B1F4B]/40 disabled:opacity-60"
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          {cooldownRemaining > 0 ? (
            <span className="text-amber-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              도배 방지: {cooldownRemaining}초 후 작성 가능
            </span>
          ) : submittedSuccess ? (
            <span className="text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              질문이 등록되었습니다. 주인이 확인 후 답변합니다.
            </span>
          ) : (
            <span className="text-[#0B1F4B]/45 font-light">
              익명으로 등록되며 수정/삭제는 불가합니다.
            </span>
          )}

          <button
            type="submit"
            disabled={submitting || !inputQuestion.trim() || cooldownRemaining > 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1F4B] text-white font-medium hover:bg-[#1D3FBB] transition-colors disabled:opacity-40 disabled:hover:bg-[#0B1F4B]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? '전송 중...' : '질문 보내기'}</span>
          </button>
        </div>
      </form>

      {/* Owner Only: Unanswered Questions Triage Box */}
      {isOwner && (
        <section className="mb-12 bg-[#DCE9FF]/40 border border-[#2F5BEA]/40 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#1D3FBB]" />
              <h2 className="text-sm font-semibold text-[#0B1F4B]">
                답변 대기 중인 질문 ({unansweredQuestions.length})
              </h2>
            </div>
            <span className="text-[11px] text-[#1D3FBB] font-mono">관리자 전용</span>
          </div>

          {unansweredQuestions.length === 0 ? (
            <p className="text-xs text-[#0B1F4B]/50 font-light">
              새로운 질문이 없습니다. 모든 질문에 답변했습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {unansweredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white border border-[rgba(11,31,75,0.12)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0B1F4B]">
                      "{q.question}"
                    </p>
                    <time className="text-[11px] text-[#0B1F4B]/45 font-mono mt-1 block">
                      {new Date(q.createdAt).toLocaleString('ko-KR')}
                    </time>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openAnswerModal(q)}
                      className="px-3 py-1.5 bg-[#1D3FBB] text-white text-xs hover:bg-[#2F5BEA] transition-colors"
                    >
                      답변 작성
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Answered Questions List: Rendered with Speech Bubbles (Dark Gray Question, Blue Answer) */}
      <section>
        <div className="flex items-baseline justify-between border-b border-[rgba(11,31,75,0.1)] pb-3 mb-6">
          <h2 className="text-base font-semibold text-[#0B1F4B]">
            답변 완료된 질문 ({answeredQuestions.length})
          </h2>
          <span className="text-xs text-[#0B1F4B]/40 font-mono">최신순</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#0B1F4B]/50 font-light">
            질문 목록을 불러오는 중...
          </div>
        ) : answeredQuestions.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[rgba(11,31,75,0.15)] p-6">
            <MessageSquare className="w-8 h-8 mx-auto text-[#0B1F4B]/30 mb-2" />
            <p className="text-xs text-[#0B1F4B]/60">아직 답변 완료된 질문이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {answeredQuestions.map((q) => (
              <article
                key={q.id}
                className="space-y-3 relative group"
              >
                {/* 1. Question: Dark Charcoal / Ink Navy Speech Bubble */}
                <div className="flex items-start justify-between gap-3">
                  <div className="max-w-[88%] sm:max-w-[80%]">
                    <PaperSpeechBubble type="question">
                      <p className="text-xs sm:text-sm font-medium leading-relaxed">
                        {q.question}
                      </p>
                      {q.createdAt && (
                        <time className="text-[10px] text-[#F6EFE3]/50 font-mono mt-1.5 block">
                          {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                        </time>
                      )}
                    </PaperSpeechBubble>
                  </div>

                  {/* Owner Controls */}
                  {isOwner && (
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-2">
                      <button
                        onClick={() => openAnswerModal(q)}
                        className="text-[#0B1F4B]/60 hover:text-[#1D3FBB] p-1"
                        title="답변 수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-red-500/60 hover:text-red-600 p-1"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Answer: Vivid Royal/Cobalt Blue Speech Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[88%] sm:max-w-[80%]">
                    <PaperSpeechBubble type="answer">
                      <div className="text-xs sm:text-sm font-light leading-relaxed whitespace-pre-wrap">
                        {q.answer || '답변을 준비 중입니다.'}
                      </div>
                      {q.answeredAt && (
                        <div className="text-[10px] text-white/60 font-mono mt-2 text-right">
                          답변 완료
                        </div>
                      )}
                    </PaperSpeechBubble>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Owner Answer Modal */}
      <Modal
        isOpen={isAnswerModalOpen}
        onClose={() => setIsAnswerModalOpen(false)}
        title="질문 답변 작성"
      >
        {answeringQuestion && (
          <form onSubmit={handleSaveAnswer} className="space-y-4">
            <div className="p-3 bg-[#18233C] text-[#F6EFE3] rounded-xs border border-[rgba(255,255,255,0.1)]">
              <span className="text-[10px] font-semibold text-[#6FA8FF] uppercase block mb-1">
                선택된 질문
              </span>
              <p className="text-xs sm:text-sm font-medium">"{answeringQuestion.question}"</p>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-[#0B1F4B]/70 mb-1">
                답변 내용 *
              </label>
              <textarea
                rows={5}
                required
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="답변을 작성하세요"
                className="w-full px-3 py-2 text-sm bg-white border border-[rgba(11,31,75,0.18)] focus:border-[#1D3FBB] focus:outline-none leading-relaxed"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-[rgba(11,31,75,0.1)]">
              <button
                type="button"
                onClick={() => setIsAnswerModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#0B1F4B]/70 hover:text-[#0B1F4B] transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={savingAnswer}
                className="px-5 py-2 bg-[#1D3FBB] text-white text-xs font-medium tracking-wide hover:bg-[#2F5BEA] transition-colors disabled:opacity-50"
              >
                {savingAnswer ? '저장 중...' : '답변 저장'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
