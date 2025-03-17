'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';

interface Solution {
  id: number;
  platform: string;
  contestName: string;
  link: string;
  createdAt: string;
}

export default function YoutubeSolutions() {
  const [form, setForm] = useState({
    platform: '',
    contestName: '',
    link: '',
  });
  const [loading, setLoading] = useState(false);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const { toast } = useToast();

  // Fetch solutions
  const fetchSolutions = useCallback(async () => {
    try {
      const response = await fetch('/api/youtube-solutions');
      const data = await response.json();
      if (response.ok) {
        setSolutions(data.solutions);
      }
    } catch (error) {
      console.error('Error fetching solutions:', error);
    }
  }, []);

  useEffect(() => {
    fetchSolutions();
  }, [fetchSolutions]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/youtube-solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add solution');
      }

      toast({
        title: 'Success',
        description: 'Solution added successfully',
      });

      setForm({ platform: '', contestName: '', link: '' });
      fetchSolutions(); // Refresh the list
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add solution',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle solution deletion
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/youtube-solutions?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete solution');
      }

      toast({
        title: 'Success',
        description: 'Solution deleted successfully',
      });

      fetchSolutions(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete solution',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add YouTube Solution</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              value={form.platform}
              onValueChange={(value) => setForm({ ...form, platform: value })}
            >
              <SelectTrigger id="platform">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Codeforces">Codeforces</SelectItem>
                <SelectItem value="CodeChef">CodeChef</SelectItem>
                <SelectItem value="LeetCode">LeetCode</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contestName">Contest Name</Label>
            <Input
              id="contestName"
              value={form.contestName}
              onChange={(e) => setForm({ ...form, contestName: e.target.value })}
              placeholder="Enter contest name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">YouTube Solution Link</Label>
            <Input
              id="link"
              type="url"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Solution'}
          </Button>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Saved Solutions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map((solution) => (
            <Card key={solution.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{solution.contestName}</h3>
                  <p className="text-sm text-gray-500">{solution.platform}</p>
                  <a 
                    href={solution.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Watch Solution
                  </a>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(solution.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 