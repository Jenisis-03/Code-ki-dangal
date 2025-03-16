"use client";

import { Calendar, Clock, ExternalLink, Filter, Search, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Contest, ContestStatus, Platform } from "@/types/contest";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";

dayjs.extend(relativeTime);
dayjs.extend(duration);

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [statusFilter, setStatusFilter] = useState<ContestStatus | "all">("Upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contestsRes] = await Promise.all([fetch("/api/contests")]);

      // Check response status for all fetches
      if (!contestsRes.ok) {
        throw new Error(`Failed to fetch contests: ${contestsRes.statusText}`);
      }

      const contestsData = await contestsRes.json();

      // Ensure contestsData.data is an array, fallback to [] if not
      const validContests = Array.isArray(contestsData.data) ? contestsData.data : [];
      if (!Array.isArray(contestsData.data)) {
        console.warn("Contests data was not an array, falling back to empty array:", contestsData);
      }

      setContests(validContests);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch data");
      setLoading(false);
    }
  };

  const filteredContests = useMemo(() => {
    return contests.filter((contest) => {
      const matchesPlatform =
        selectedPlatforms.length === 0 || selectedPlatforms.includes(contest.platform);
      const matchesStatus = statusFilter === "all" || contest.status === statusFilter;
      const isRelevantStatus = contest.status === "Upcoming";
      const matchesSearch =
        contest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contest.platform.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesPlatform && matchesStatus && matchesSearch && isRelevantStatus;
    });
  }, [contests, selectedPlatforms, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredContests.length / itemsPerPage);
  const paginatedContests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredContests.slice(start, start + itemsPerPage);
  }, [filteredContests, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPlatforms, statusFilter, searchTerm]);

  // Add contest metrics calculation
  const contestMetrics = useMemo(() => {
    const metrics = {
      total: contests.length,
      platforms: {
        Codeforces: contests.filter(c => c.platform === "Codeforces").length,
        CodeChef: contests.filter(c => c.platform === "CodeChef").length,
        LeetCode: contests.filter(c => c.platform === "LeetCode").length
      },
      status: {
        Upcoming: contests.filter(c => c.status === "Upcoming").length,
        Past: contests.filter(c => c.status === "Past").length
      },
      byPlatformAndStatus: {
        Codeforces: {
          Upcoming: contests.filter(c => c.platform === "Codeforces" && c.status === "Upcoming").length,
          Past: contests.filter(c => c.platform === "Codeforces" && c.status === "Past").length
        },
        CodeChef: {
          Upcoming: contests.filter(c => c.platform === "CodeChef" && c.status === "Upcoming").length,
          Past: contests.filter(c => c.platform === "CodeChef" && c.status === "Past").length
        },
        LeetCode: {
          Upcoming: contests.filter(c => c.platform === "LeetCode" && c.status === "Upcoming").length,
          Past: contests.filter(c => c.platform === "LeetCode" && c.status === "Past").length
        }
      }
    };
    return metrics;
  }, [contests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-red-200 via-white to-orange-200">
        <div className="text-red-600 bg-red-50 px-6 py-4 rounded-lg shadow-sm border border-red-100">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 relative">
        {/* Theme Toggle */}
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-2xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl border border-white/20 dark:border-gray-700/20 shadow-lg shadow-black/5 dark:shadow-black/10 hover:shadow-xl hover:bg-white/20 dark:hover:bg-gray-800/20 hover:border-white/30 dark:hover:border-gray-700/30 transition-all duration-300"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex flex-col items-center">
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-bold font-mono bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-4 px-2 tracking-tight">
              <span className="text-indigo-600 dark:text-indigo-400">{`{`}</span>
              Code Ki Dangal
              <span className="text-pink-600 dark:text-pink-400">{`}`}</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-2 mb-6 font-mono tracking-tight">
              <span className="text-indigo-600 dark:text-indigo-400">const</span>{" "}
              <span className="text-purple-600 dark:text-purple-400">purpose</span> = 
              <span className="text-pink-600 dark:text-pink-400">{" 'Track and participate in programming contests across multiple platforms'"}</span>;
            </p>
            <div className="inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 shadow-lg shadow-black/5 dark:shadow-black/10">
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-mono">
                <span className="text-green-600 dark:text-green-400 font-mono tracking-tight">contests.upcoming.length</span> = 
                <span className="font-semibold text-green-600 dark:text-green-400 ml-2">{contestMetrics.status.Upcoming}</span>
              </div>
              <div className="h-4 w-px bg-white/20 dark:bg-gray-700/20"></div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-mono">
                <span className="text-gray-800 dark:text-gray-200 font-mono tracking-tight">contests.past.length</span> = 
                <span className="font-semibold text-gray-800 dark:text-gray-200 ml-2">{contestMetrics.status.Past}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="relative mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors duration-200" />
              </div>
              <Input
                type="text"
                placeholder="// Search contests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-base font-mono bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/10
                  focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 focus:border-white/30 dark:focus:border-gray-700/30
                  hover:bg-white/20 dark:hover:bg-gray-800/20 hover:border-white/30 dark:hover:border-gray-700/30
                  transition-all duration-200
                  placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-mono"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                variant="outline"
                className={`
                  h-11 px-4 text-sm font-medium bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/10
                  hover:bg-white/20 dark:hover:bg-gray-800/20 hover:border-white/30 dark:hover:border-gray-700/30
                  transition-all duration-200
                  ${isFiltersOpen ? 'ring-2 !ring-indigo-500/50 dark:!ring-indigo-400/50 !border-white/30 dark:!border-gray-700/30 text-indigo-600 dark:text-indigo-400' : ''}
                `}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                  {selectedPlatforms.length + (statusFilter !== "all" ? 1 : 0)}
                </span>
              </Button>
              {(selectedPlatforms.length > 0 || statusFilter !== "all" || searchTerm) && (
                <Button
                  onClick={() => {
                    setStatusFilter("Upcoming");
                    setSelectedPlatforms([]);
                    setSearchTerm("");
                  }}
                  variant="outline"
                  className="h-11 px-4 text-sm font-medium bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/10
                    hover:bg-rose-500/10 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200/30 dark:hover:border-rose-800/30
                    transition-all duration-200"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          <div className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isFiltersOpen ? 'max-h-96 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}
          `}>
            <Card className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 shadow-lg shadow-black/5 dark:shadow-black/10 rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Platform</label>
                    <Select
                      value={selectedPlatforms.length > 0 ? selectedPlatforms.join(",") : "all"}
                      onValueChange={(value) =>
                        setSelectedPlatforms(value === "all" ? [] : (value.split(",") as Platform[]))
                      }
                    >
                      <SelectTrigger className="h-11 bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 rounded-2xl">
                        <SelectValue placeholder="All Platforms" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border-white/20 dark:border-gray-700/20">
                        <SelectItem value="all">All Platforms</SelectItem>
                        <SelectItem value="Codeforces">Codeforces</SelectItem>
                        <SelectItem value="CodeChef">CodeChef</SelectItem>
                        <SelectItem value="LeetCode">LeetCode</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value as ContestStatus | "all")}
                    >
                      <SelectTrigger className="h-11 bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 rounded-2xl">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border-white/20 dark:border-gray-700/20">
                        <SelectItem value="Upcoming">Upcoming</SelectItem>
                        <SelectItem value="Past">Past</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Filters */}
                {(selectedPlatforms.length > 0 || statusFilter !== "all") && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {selectedPlatforms.map((platform) => (
                      <Badge
                        key={platform}
                        className="px-3 py-1 text-sm bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-400/20
                          hover:bg-indigo-500/20 dark:hover:bg-indigo-400/20 cursor-pointer rounded-lg transition-all duration-200"
                        onClick={() => setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))}
                      >
                        {platform}
                        <span className="ml-2 text-indigo-500 dark:text-indigo-400">×</span>
                      </Badge>
                    ))}
                    {statusFilter !== "all" && (
                      <Badge
                        className="px-3 py-1 text-sm bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-400/20
                          hover:bg-indigo-500/20 dark:hover:bg-indigo-400/20 cursor-pointer rounded-lg transition-all duration-200"
                        onClick={() => setStatusFilter("all")}
                      >
                        {statusFilter}
                        <span className="ml-2 text-indigo-500 dark:text-indigo-400">×</span>
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contest Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedContests.map((contest) => {
            const startTime = dayjs(contest.startTime);
            const duration = dayjs.duration(contest.duration);
            const timeRemaining = startTime.diff(dayjs());

            return (
              <Card 
                key={contest.id} 
                className={`
                  group hover:shadow-2xl transition-all duration-300 font-mono
                  bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 shadow-lg shadow-black/5 dark:shadow-black/10 rounded-2xl overflow-hidden
                  hover:bg-white/20 dark:hover:bg-gray-800/20 hover:border-white/30 dark:hover:border-gray-700/30
                  ${contest.status === "Upcoming" ? "ring-1 ring-green-500/20 dark:ring-green-400/20" : ""}
                `}
              >
                <CardHeader className="p-6 pb-3">
                  <div className="flex flex-wrap gap-2 justify-between items-start mb-3">
                    <Badge
                      className={`
                        px-3 py-1 text-sm font-mono font-medium rounded-lg backdrop-blur-2xl shadow-sm shadow-black/5 dark:shadow-black/10
                        ${
                          contest.platform === "LeetCode"
                            ? "bg-indigo-500/20 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 dark:border-indigo-400/30"
                            : contest.platform === "Codeforces"
                            ? "bg-purple-500/20 dark:bg-purple-400/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 dark:border-purple-400/30"
                            : "bg-orange-500/20 dark:bg-orange-400/20 text-orange-700 dark:text-orange-300 border border-orange-500/30 dark:border-orange-400/30"
                        }
                      `}
                    >
                      {contest.platform}
                    </Badge>
                    <Badge
                      className={`
                        px-3 py-1 text-sm font-mono font-medium rounded-lg backdrop-blur-2xl shadow-sm shadow-black/5 dark:shadow-black/10
                        ${
                          contest.status === "Upcoming"
                            ? "bg-green-500/20 dark:bg-green-400/20 text-green-700 dark:text-green-300 border border-green-500/30 dark:border-green-400/30"
                            : "bg-rose-500/20 dark:bg-rose-400/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 dark:border-rose-400/30"
                        }
                      `}
                    >
                      {contest.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold font-mono line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">
                    <a href={contest.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {contest.name}
                    </a>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-6 pb-6">
                  <div className="flex items-center text-gray-600 dark:text-gray-300 font-mono">
                    <Calendar className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="font-medium tracking-tight">{startTime.format("MMM D, YYYY h:mm A")}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-300 font-mono">
                    <Clock className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="font-medium tracking-tight">{`${Math.floor(duration.asHours())}h ${duration.minutes()}m`}</span>
                  </div>
                  {contest.status === "Upcoming" && timeRemaining > 0 && (
                    <>
                      <div className="text-sm font-medium font-mono tracking-tight bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent">
                        <span className="text-gray-600 dark:text-gray-300">timeUntilStart =</span> {dayjs.duration(timeRemaining).humanize()}
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <div className="text-xs font-mono text-gray-600 dark:text-gray-300">
                          <span className="text-indigo-600 dark:text-indigo-400">const</span>{" "}
                          <span className="text-purple-600 dark:text-purple-400">remainingTime</span> = {"{"}
                        </div>
                        {dayjs.duration(timeRemaining).days() > 0 && (
                          <div className="text-xs font-mono pl-4 text-gray-600 dark:text-gray-300">
                            <span className="text-emerald-600 dark:text-emerald-400">days:</span>{" "}
                            <span className="text-orange-600 dark:text-orange-400">{dayjs.duration(timeRemaining).days()}</span>,
                          </div>
                        )}
                        {dayjs.duration(timeRemaining).hours() > 0 && (
                          <div className="text-xs font-mono pl-4 text-gray-600 dark:text-gray-300">
                            <span className="text-emerald-600 dark:text-emerald-400">hours:</span>{" "}
                            <span className="text-orange-600 dark:text-orange-400">{dayjs.duration(timeRemaining).hours()}</span>,
                          </div>
                        )}
                        {dayjs.duration(timeRemaining).minutes() > 0 && (
                          <div className="text-xs font-mono pl-4 text-gray-600 dark:text-gray-300">
                            <span className="text-emerald-600 dark:text-emerald-400">minutes:</span>{" "}
                            <span className="text-orange-600 dark:text-orange-400">{dayjs.duration(timeRemaining).minutes()}</span>,
                          </div>
                        )}
                        <div className="text-xs font-mono pl-4 text-gray-600 dark:text-gray-300">
                          <span className="text-emerald-600 dark:text-emerald-400">seconds:</span>{" "}
                          <span className="text-orange-600 dark:text-orange-400">{dayjs.duration(timeRemaining).seconds()}</span>
                        </div>
                        <div className="text-xs font-mono text-gray-600 dark:text-gray-300">{"}"}</div>
                      </div>
                    </>
                  )}
                  {contest.status === "Past" && (
                    <div className="text-sm font-medium font-mono tracking-tight text-gray-500 dark:text-gray-400">
                      <span className="text-gray-600 dark:text-gray-300">status =</span> completed
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3 justify-between items-center px-6 pb-6">
                  <Badge variant="outline" className={`
                    px-3 py-1 text-sm font-mono font-medium rounded-lg backdrop-blur-2xl shadow-sm shadow-black/5 dark:shadow-black/10
                    ${
                      contest.difficulty === "Easy"
                        ? "bg-green-500/10 dark:bg-green-400/10 text-green-700 dark:text-green-300 border border-green-500/20 dark:border-green-400/20"
                        : contest.difficulty === "Medium"
                        ? "bg-yellow-500/10 dark:bg-yellow-400/10 text-yellow-700 dark:text-yellow-300 border border-yellow-500/20 dark:border-yellow-400/20"
                        : "bg-red-500/10 dark:bg-red-400/10 text-red-700 dark:text-red-300 border border-red-500/20 dark:border-red-400/20"
                    }
                  `}>
                    {contest.difficulty}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`
                      h-9 px-4 text-sm font-mono font-medium bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-sm shadow-black/5 dark:shadow-black/10
                      ${contest.status === "Upcoming"
                        ? "hover:bg-green-500/10 dark:hover:bg-green-400/10 hover:text-green-700 dark:hover:text-green-300 hover:border-green-500/20 dark:hover:border-green-400/20"
                        : "hover:bg-gray-500/10 dark:hover:bg-gray-400/10 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-500/20 dark:hover:border-gray-400/20"}
                      transition-all duration-200
                    `}
                    asChild
                  >
                    <a href={contest.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {contest.status === "Upcoming" ? "Register" : "View"}
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {paginatedContests.length === 0 && (
          <Card className="py-12 bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 shadow-lg shadow-black/5 dark:shadow-black/10 rounded-2xl">
            <CardContent className="text-center px-6">
              <div className="text-gray-600 dark:text-gray-300 text-lg mb-6 font-mono font-medium tracking-tight">
                <span className="text-red-600 dark:text-red-400">Error:</span> No contests found
              </div>
              <Button
                onClick={() => {
                  setStatusFilter("Upcoming");
                  setSelectedPlatforms([]);
                  setSearchTerm("");
                }}
                variant="outline"
                className="h-11 px-6 text-sm font-mono font-medium bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/10
                  hover:bg-indigo-500/10 dark:hover:bg-indigo-400/10 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-500/20 dark:hover:border-indigo-400/20
                  transition-all duration-200"
              >
                Clear filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 sm:mt-12">
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              variant="outline"
              className="h-11 px-6 text-sm font-mono font-medium bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 rounded-2xl w-full sm:w-auto shadow-lg shadow-black/5 dark:shadow-black/10
                hover:bg-indigo-500/10 dark:hover:bg-indigo-400/10 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-500/20 dark:hover:border-indigo-400/20
                disabled:bg-gray-500/5 dark:disabled:bg-gray-400/5 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:border-gray-200/10 dark:disabled:border-gray-700/10
                transition-all duration-200"
            >
              Previous
            </Button>
            <span className="text-gray-700 dark:text-gray-300 font-mono font-medium text-sm tracking-tight">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              variant="outline"
              className="h-11 px-6 text-sm font-mono font-medium bg-white/10 dark:bg-gray-800/10 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 rounded-2xl w-full sm:w-auto shadow-lg shadow-black/5 dark:shadow-black/10
                hover:bg-indigo-500/10 dark:hover:bg-indigo-400/10 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-500/20 dark:hover:border-indigo-400/20
                disabled:bg-gray-500/5 dark:disabled:bg-gray-400/5 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:border-gray-200/10 dark:disabled:border-gray-700/10
                transition-all duration-200"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}