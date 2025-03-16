import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export function formatDuration(durationStr: string): string {
  const dur = dayjs.duration(durationStr);
  const hours = Math.floor(dur.asHours());
  const minutes = dur.minutes();
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function formatTimeRemaining(startTime: string): string {
  const start = dayjs(startTime);
  const now = dayjs();
  
  if (start.isBefore(now)) {
    return 'Started';
  }
  
  const diff = start.diff(now);
  const dur = dayjs.duration(diff);
  
  if (dur.asDays() >= 1) {
    return `${Math.floor(dur.asDays())}d ${dur.hours()}h`;
  }
  return `${dur.hours()}h ${dur.minutes()}m`;
}

export function getContestStatus(startTime: string, duration: string): 'Past' | 'Ongoing' | 'Upcoming' {
  const now = dayjs();
  const start = dayjs(startTime);
  const end = start.add(dayjs.duration(duration));
  
  if (now.isAfter(end)) {
    return 'Past';
  }
  if (now.isAfter(start)) {
    return 'Ongoing';
  }
  return 'Upcoming';
} 