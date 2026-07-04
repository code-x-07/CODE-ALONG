import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSessionCall } from "./SessionCallContext";
import { useWorkspace } from "./WorkspaceContext";
import { executeCode } from "../utils/executeCode";
import {
  ARENA_COUNTDOWN_MS,
  ARENA_DURATION_MS,
  ArenaSubmissionResult,
  buildArenaHarness,
  getChallengeById,
  parseArenaResult,
  pickRandomChallenge,
} from "../arena/challenges";

export type ArenaMatchStatus = "idle" | "countdown" | "active" | "finished";

export type ArenaMatch = {
  status: Exclude<ArenaMatchStatus, "finished">;
  challengeId: string;
  /** Epoch ms when the coding phase starts (countdown ends). */
  startAt: number;
  durationMs: number;
};

export type ArenaScore = {
  passed: number;
  total: number;
  /** Milliseconds from match start to the submission that produced this score. */
  timeMs: number;
  attempts: number;
};

type ArenaContextValue = {
  match: ArenaMatch | null;
  /** Live status derived from the match clock. */
  status: ArenaMatchStatus;
  scores: Record<string, ArenaScore>;
  opponentCode: Record<string, string>;
  isSubmitting: boolean;
  lastSubmission: ArenaSubmissionResult | null;
  submissionError: string | null;
  /** Millis remaining in the current phase (countdown or coding), floored at 0. */
  remainingMs: number;
  startMatch: () => void;
  resetMatch: () => void;
  submitSolution: () => Promise<void>;
};

const TOPIC_AR_HELLO = "ar:hello";
const TOPIC_AR_STATE = "ar:state";
const TOPIC_AR_CODE = "ar:code";
const TOPIC_AR_SCORE = "ar:score";
const CODE_BROADCAST_THROTTLE_MS = 150;
const CLOCK_TICK_MS = 250;

const ArenaContext = createContext<ArenaContextValue | null>(null);

function deriveStatus(match: ArenaMatch | null, now: number): ArenaMatchStatus {
  if (!match) {
    return "idle";
  }

  if (now < match.startAt) {
    return "countdown";
  }

  if (now < match.startAt + match.durationMs) {
    return "active";
  }

  return "finished";
}

export function ArenaProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, sendData, subscribeData, localIdentity } = useSessionCall();
  const { arenaPlayerCode, setArenaPlayerCode, appendTerminalEntry } = useWorkspace();

  const [match, setMatch] = useState<ArenaMatch | null>(null);
  const [scores, setScores] = useState<Record<string, ArenaScore>>({});
  const [opponentCode, setOpponentCode] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<ArenaSubmissionResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const matchRef = useRef<ArenaMatch | null>(match);
  matchRef.current = match;
  const scoresRef = useRef(scores);
  scoresRef.current = scores;
  const codeBroadcastTimerRef = useRef<number | null>(null);
  const latestCodeRef = useRef(arenaPlayerCode);
  latestCodeRef.current = arenaPlayerCode;

  const status = deriveStatus(match, now);

  // Shared clock for countdown + timer UI.
  useEffect(() => {
    if (!match) {
      return;
    }

    const interval = window.setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => window.clearInterval(interval);
  }, [match]);

  // Realtime sync.
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    sendData(TOPIC_AR_HELLO, {});

    const unsubscribes = [
      subscribeData(TOPIC_AR_HELLO, () => {
        if (matchRef.current) {
          sendData(TOPIC_AR_STATE, { match: matchRef.current, scores: scoresRef.current });
        }
      }),
      subscribeData(TOPIC_AR_STATE, (payload) => {
        const incoming = payload as { match?: ArenaMatch | null; scores?: Record<string, ArenaScore> };

        if (incoming.match === null) {
          setMatch(null);
          setScores({});
          setLastSubmission(null);
          setSubmissionError(null);
          return;
        }

        if (incoming.match?.challengeId) {
          const challenge = getChallengeById(incoming.match.challengeId);
          const isNewMatch = matchRef.current?.startAt !== incoming.match.startAt;
          setMatch(incoming.match);
          setNow(Date.now());

          if (incoming.scores) {
            setScores((current) => ({ ...incoming.scores, ...current }));
          }

          if (isNewMatch && challenge) {
            // Everyone codes from the same starter when a fresh match begins.
            setArenaPlayerCode(challenge.starterCode);
            setLastSubmission(null);
            setSubmissionError(null);
          }
        }
      }),
      subscribeData(TOPIC_AR_CODE, (payload, senderIdentity) => {
        const { code } = (payload || {}) as { code?: string };

        if (typeof code === "string") {
          setOpponentCode((current) => ({ ...current, [senderIdentity]: code }));
        }
      }),
      subscribeData(TOPIC_AR_SCORE, (payload, senderIdentity) => {
        const incoming = payload as ArenaScore;

        if (typeof incoming?.passed === "number" && typeof incoming?.total === "number") {
          setScores((current) => ({ ...current, [senderIdentity]: incoming }));
        }
      }),
    ];

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [isConnected, sendData, setArenaPlayerCode, subscribeData]);

  // Stream own code to the opponent while a match is running.
  useEffect(() => {
    if (!isConnected || (status !== "active" && status !== "countdown")) {
      return;
    }

    if (codeBroadcastTimerRef.current !== null) {
      return;
    }

    codeBroadcastTimerRef.current = window.setTimeout(() => {
      codeBroadcastTimerRef.current = null;
      sendData(TOPIC_AR_CODE, { code: latestCodeRef.current });
    }, CODE_BROADCAST_THROTTLE_MS);
  }, [arenaPlayerCode, isConnected, sendData, status]);

  useEffect(
    () => () => {
      if (codeBroadcastTimerRef.current !== null) {
        window.clearTimeout(codeBroadcastTimerRef.current);
      }
    },
    [],
  );

  const startMatch = useCallback(() => {
    const challenge = pickRandomChallenge();
    const nextMatch: ArenaMatch = {
      status: "countdown",
      challengeId: challenge.id,
      startAt: Date.now() + ARENA_COUNTDOWN_MS,
      durationMs: ARENA_DURATION_MS,
    };

    setMatch(nextMatch);
    setScores({});
    setLastSubmission(null);
    setSubmissionError(null);
    setArenaPlayerCode(challenge.starterCode);
    setNow(Date.now());
    sendData(TOPIC_AR_STATE, { match: nextMatch, scores: {} });
  }, [sendData, setArenaPlayerCode]);

  const resetMatch = useCallback(() => {
    setMatch(null);
    setScores({});
    setLastSubmission(null);
    setSubmissionError(null);
    sendData(TOPIC_AR_STATE, { match: null });
  }, [sendData]);

  const submitSolution = useCallback(async () => {
    const currentMatch = matchRef.current;
    const challenge = getChallengeById(currentMatch?.challengeId);

    if (!currentMatch || !challenge || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const stdout = await executeCode({
        language: "javascript",
        sourceCode: buildArenaHarness(challenge, latestCodeRef.current),
        fileName: "arena.js",
      });

      const result = parseArenaResult(stdout);

      if (!result) {
        throw new Error("Could not read the test results. Make sure your function is defined and does not crash.");
      }

      setLastSubmission(result);

      const identity = localIdentity || "You";
      const nextScore: ArenaScore = {
        passed: result.passed,
        total: result.total,
        timeMs: Math.max(0, Date.now() - currentMatch.startAt),
        attempts: (scoresRef.current[identity]?.attempts || 0) + 1,
      };

      setScores((current) => ({ ...current, [identity]: nextScore }));
      sendData(TOPIC_AR_SCORE, nextScore);
      appendTerminalEntry(
        result.passed === result.total ? "output" : "system",
        `Arena: ${result.passed}/${result.total} tests passed.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Arena submission failed.";
      setSubmissionError(message);
      appendTerminalEntry("error", `Arena: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [appendTerminalEntry, isSubmitting, localIdentity, sendData]);

  const remainingMs = useMemo(() => {
    if (!match) {
      return 0;
    }

    if (status === "countdown") {
      return Math.max(0, match.startAt - now);
    }

    return Math.max(0, match.startAt + match.durationMs - now);
  }, [match, now, status]);

  const value = useMemo(
    () => ({
      match,
      status,
      scores,
      opponentCode,
      isSubmitting,
      lastSubmission,
      submissionError,
      remainingMs,
      startMatch,
      resetMatch,
      submitSolution,
    }),
    [
      isSubmitting,
      lastSubmission,
      match,
      opponentCode,
      remainingMs,
      resetMatch,
      scores,
      startMatch,
      status,
      submissionError,
      submitSolution,
    ],
  );

  return <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>;
}

export function useArena() {
  const context = useContext(ArenaContext);

  if (!context) {
    throw new Error("useArena must be used within an ArenaProvider.");
  }

  return context;
}
