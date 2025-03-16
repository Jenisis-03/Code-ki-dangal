'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export default function SolutionForm() {
  const [form, setForm] = useState({
    platform: '',
    contestName: '',
    link: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/solutions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    alert('Solution link added!');
    setForm({ platform: '', contestName: '', link: '' });
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Add Solution</h1>
      
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

        <Button type="submit" className="w-full">
          Add Solution
        </Button>
      </form>
    </div>
  );
} 