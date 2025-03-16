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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add Solution Link</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Platform</Label>
          <Select
            value={form.platform}
            onValueChange={(value) => setForm((prev) => ({ ...prev, platform: value }))}
          >
            <SelectTrigger>
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
          <Label>Contest Name</Label>
          <Input
            value={form.contestName}
            onChange={(e) => setForm((prev) => ({ ...prev, contestName: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>YouTube Link</Label>
          <Input
            value={form.link}
            onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
          />
        </div>

        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}