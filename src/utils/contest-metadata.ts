import { Contest, Platform } from "@/types/contest";

export function determineCodeforcesContestDifficulty(contestName: string): Contest['difficulty'] {
  const name = contestName.toLowerCase();
  if (name.includes('div. 1')) {
    return 'Hard';
  } else if (name.includes('div. 2')) {
    return 'Medium';
  } else if (name.includes('div. 3') || name.includes('educational')) {
    return 'Easy';
  }
  return 'Medium';
}

export function determineCodeChefContestDifficulty(contestCode: string): Contest['difficulty'] {
  const code = contestCode.toLowerCase();
  if (code.includes('ltime') || code.includes('cook')) {
    return 'Medium';
  } else if (code.includes('start') || code.includes('starters')) {
    return 'Easy';
  } else if (code.includes('challenge') || code.includes('long')) {
    return 'Hard';
  }
  return 'Medium';
}

export function determineLeetCodeContestDifficulty(
  difficulty?: string,
  contestType?: string
): Contest['difficulty'] {
  if (difficulty === 'Easy' || contestType === 'Biweekly') {
    return 'Easy';
  } else if (difficulty === 'Medium' || contestType === 'Weekly') {
    return 'Medium';
  } else if (difficulty === 'Hard') {
    return 'Hard';
  }
  return 'Medium';
}

export function calculateContestMetrics(contests: Contest[]) {
  return {
    total: contests.length,
    platforms: {
      Codeforces: contests.filter(c => c.platform === "Codeforces").length,
      CodeChef: contests.filter(c => c.platform === "CodeChef").length,
      LeetCode: contests.filter(c => c.platform === "LeetCode").length
    },
    status: {
      Upcoming: contests.filter(c => c.status === "Upcoming").length,
      Ongoing: contests.filter(c => c.status === "Ongoing").length,
      Past: contests.filter(c => c.status === "Past").length
    },
    difficulty: {
      Easy: contests.filter(c => c.difficulty === "Easy").length,
      Medium: contests.filter(c => c.difficulty === "Medium").length,
      Hard: contests.filter(c => c.difficulty === "Hard").length
    }
  };
}

export function enrichContestData(contestData: Partial<Contest>, platform: Platform): Contest {
  return {
    id: contestData.id || '',
    name: contestData.name || '',
    platform: platform,
    url: contestData.url || '',
    startTime: contestData.startTime || new Date().toISOString(),
    duration: contestData.duration || '',
    status: contestData.status || 'Upcoming',
    difficulty: contestData.difficulty || 'Medium',
    isBookmarked: false,
    ...contestData
  };
}