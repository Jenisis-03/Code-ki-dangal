'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

type Contest = {
  id: string;
  platform: string;
  name: string;
  start: string;
  duration: string;
  status: 'Past' | 'Ongoing' | 'Upcoming';
  url: string;
  solutionLink?: string;
};

export function ContestTracker() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    codeforces: true,
    codechef: true,
    leetcode: true,
  });

  useEffect(() => {
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    setBookmarks(new Set(savedBookmarks));

    fetch('/api/contests')
      .then((res) => res.json())
      .then(setContests);
  }, []);

  const toggleBookmark = (id: string) => {
    const newBookmarks = new Set(bookmarks);
    newBookmarks.has(id) ? newBookmarks.delete(id) : newBookmarks.add(id);
    setBookmarks(newBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify([...newBookmarks]));
  };

  const filteredContests = contests.filter(
    (contest) =>
      filters[contest.platform.toLowerCase()] && (contest.status !== 'Past' || contest.solutionLink)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {Object.entries(filters).map(([platform, checked]) => (
          <label key={platform} className="flex items-center gap-2">
            <Checkbox
              checked={checked}
              onCheckedChange={() =>
                setFilters((prev) => ({
                  ...prev,
                  [platform]: !prev[platform],
                }))
              }
            />
            <span className="capitalize">{platform}</span>
          </label>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Platform</TableHead>
            <TableHead>Contest</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Time Remaining</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredContests.map((contest) => {
            const startTime = dayjs(contest.start);
            const now = dayjs();
            const timeRemaining = startTime.diff(now);

            return (
              <TableRow key={contest.id}>
                <TableCell>
                  <Badge variant="outline">{contest.platform}</Badge>
                </TableCell>
                <TableCell>
                  <a href={contest.url} target="_blank" className="hover:underline">
                    {contest.name}
                  </a>
                  {contest.solutionLink && (
                    <a href={contest.solutionLink} className="ml-2 text-blue-500">
                      (Solutions)
                    </a>
                  )}
                </TableCell>
                <TableCell>{startTime.format('MMM D, YYYY h:mm A')}</TableCell>
                <TableCell>
                  {contest.status === 'Upcoming' && timeRemaining > 0
                    ? dayjs.duration(timeRemaining).format('D[d] H[h] m[m]')
                    : '—'}
                </TableCell>
                <TableCell>{contest.duration}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => toggleBookmark(contest.id)}>
                    {bookmarks.has(contest.id) ? (
                      <BookmarkCheck className="text-primary" />
                    ) : (
                      <Bookmark />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}