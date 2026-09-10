import { GauntletControllerGetLeaderboardDifficultyEnum as Difficulty } from '@/sdk/apis/ApiApi';
import { SNIPPET_STEPS } from './snippet-timeline';

export const DIFFICULTIES: {
  value: Difficulty;
  label: string;
  duration: string;
  accent: string;
  text: string;
}[] = [
  {
    value: Difficulty.Easy,
    label: 'Easy',
    duration: `${SNIPPET_STEPS[4]}s`,
    accent: 'bg-emerald-500/15 text-emerald-300',
    text: 'text-emerald-300',
  },
  {
    value: Difficulty.Medium,
    label: 'Medium',
    duration: `${SNIPPET_STEPS[3]}s`,
    accent: 'bg-blue-500/15 text-blue-300',
    text: 'text-blue-300',
  },
  {
    value: Difficulty.Hard,
    label: 'Hard',
    duration: `${SNIPPET_STEPS[2]}s`,
    accent: 'bg-orange-500/15 text-orange-300',
    text: 'text-orange-300',
  },
  {
    value: Difficulty.Expert,
    label: 'Expert',
    duration: `${SNIPPET_STEPS[1]}s`,
    accent: 'bg-red-500/15 text-red-300',
    text: 'text-red-300',
  },
];
