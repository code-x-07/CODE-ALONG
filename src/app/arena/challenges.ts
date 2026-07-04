// Arena challenge bank. Each challenge ships with hidden tests that run inside
// the Piston sandbox via the generated harness below.

export type ArenaTest = {
  args: unknown[];
  expected: unknown;
};

export type ArenaChallenge = {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  functionName: string;
  prompt: string;
  starterCode: string;
  tests: ArenaTest[];
};

export const ARENA_DURATION_MS = 5 * 60 * 1000;
export const ARENA_COUNTDOWN_MS = 3 * 1000;

export const ARENA_CHALLENGES: ArenaChallenge[] = [
  {
    id: "reverse-words",
    title: "Reverse the Words",
    difficulty: "easy",
    functionName: "reverseWords",
    prompt:
      "Given a sentence, return it with the word order reversed. Words are separated by single spaces and there is no leading or trailing whitespace.",
    starterCode: `// Reverse the Words
// Return the sentence with word order reversed.
function reverseWords(sentence) {
  // your solution
}`,
    tests: [
      { args: ["hello world"], expected: "world hello" },
      { args: ["the quick brown fox"], expected: "fox brown quick the" },
      { args: ["one"], expected: "one" },
      { args: ["code along wins"], expected: "wins along code" },
    ],
  },
  {
    id: "sum-of-digits",
    title: "Digital Root",
    difficulty: "easy",
    functionName: "digitalRoot",
    prompt:
      "Repeatedly sum the digits of a non-negative integer until a single digit remains, and return that digit.",
    starterCode: `// Digital Root
// Keep summing digits until one digit remains.
function digitalRoot(n) {
  // your solution
}`,
    tests: [
      { args: [16], expected: 7 },
      { args: [942], expected: 6 },
      { args: [132189], expected: 6 },
      { args: [0], expected: 0 },
      { args: [493193], expected: 2 },
    ],
  },
  {
    id: "valid-brackets",
    title: "Balanced Brackets",
    difficulty: "medium",
    functionName: "isBalanced",
    prompt:
      "Given a string containing only the characters ()[]{} return true when every bracket closes in the correct order, otherwise false.",
    starterCode: `// Balanced Brackets
// Return true when brackets close in the right order.
function isBalanced(s) {
  // your solution
}`,
    tests: [
      { args: ["()[]{}"], expected: true },
      { args: ["([)]"], expected: false },
      { args: ["{[()]}"], expected: true },
      { args: ["((("], expected: false },
      { args: [""], expected: true },
    ],
  },
  {
    id: "two-sum",
    title: "Two Sum Indices",
    difficulty: "medium",
    functionName: "twoSum",
    prompt:
      "Given an array of numbers and a target, return the indices of the two numbers that add up to the target as an array [i, j] with i < j. Exactly one solution exists.",
    starterCode: `// Two Sum Indices
// Return [i, j] with i < j such that nums[i] + nums[j] === target.
function twoSum(nums, target) {
  // your solution
}`,
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[1, 5, 9, 13], 22], expected: [2, 3] },
    ],
  },
  {
    id: "longest-streak",
    title: "Longest Consecutive Streak",
    difficulty: "hard",
    functionName: "longestStreak",
    prompt:
      "Given an unsorted array of integers, return the length of the longest run of consecutive values (e.g. [100, 4, 200, 1, 3, 2] contains 1,2,3,4 so the answer is 4).",
    starterCode: `// Longest Consecutive Streak
// Return the length of the longest run of consecutive integers.
function longestStreak(nums) {
  // your solution
}`,
    tests: [
      { args: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
      { args: [[]], expected: 0 },
      { args: [[9]], expected: 1 },
      { args: [[1, 2, 0, 1]], expected: 3 },
    ],
  },
];

export function getChallengeById(challengeId: string | null | undefined) {
  return ARENA_CHALLENGES.find((challenge) => challenge.id === challengeId) || null;
}

export function pickRandomChallenge() {
  return ARENA_CHALLENGES[Math.floor(Math.random() * ARENA_CHALLENGES.length)];
}

const RESULT_MARKER = "__ARENA_RESULT__";

/** Wraps the player's code with the hidden test harness for sandbox execution. */
export function buildArenaHarness(challenge: ArenaChallenge, playerCode: string) {
  return `${playerCode}

// ---- Code Along Arena harness (auto-generated) ----
const __tests = ${JSON.stringify(challenge.tests)};
let __passed = 0;
const __results = __tests.map((test) => {
  try {
    const output = ${challenge.functionName}(...test.args);
    const ok = JSON.stringify(output) === JSON.stringify(test.expected);
    if (ok) __passed += 1;
    return ok;
  } catch (error) {
    return false;
  }
});
console.log(${JSON.stringify(RESULT_MARKER)} + JSON.stringify({ passed: __passed, total: __tests.length, results: __results }));
`;
}

export type ArenaSubmissionResult = {
  passed: number;
  total: number;
  results: boolean[];
};

/** Extracts the harness result from sandbox stdout, or null when missing. */
export function parseArenaResult(stdout: string): ArenaSubmissionResult | null {
  const line = stdout
    .split("\n")
    .reverse()
    .find((current) => current.includes(RESULT_MARKER));

  if (!line) {
    return null;
  }

  try {
    return JSON.parse(line.slice(line.indexOf(RESULT_MARKER) + RESULT_MARKER.length)) as ArenaSubmissionResult;
  } catch {
    return null;
  }
}
