import React, { useState } from 'react';
import {
  GitPullRequest,
  MessageSquare,
  Clock,
  Users,
  Tag,
  Milestone,
  ExternalLink,
  ChevronDown,
  Edit,
  Code2,
  GitBranch,
  History,
  Activity,
  Files
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface MergeRequest {
  id: string;
  title: string;
  status: 'Open' | 'Merged' | 'Closed';
  author: string;
  authorAvatar?: string;
  requestedAt: string;
  sourceBranch: string;
  targetBranch: string;
  description: string;
  relatedIssue?: string;
  assignee?: string;
  reviewer?: string;
  labels: string[];
  milestone?: string | null;
  timeTracking: string;
  participants: string[];
}

const mockMR: MergeRequest = {
  id: "!6",
  title: "feat: integrate thumbnails api",
  status: "Open",
  author: "Sreekesh Kamath",
  requestedAt: "1 week ago",
  sourceBranch: "implement-thumbnails-api",
  targetBranch: "dev",
  description: "This MR integrates the thumbnails API with the Timeline/AssetGrid components to display decrypted thumbnails in an infinite scroll view. The implementation replaces mock data with real API calls, enabling users to view their photo library with proper pagination and loading states.",
  relatedIssue: "plans/thumbnails-integration.md",
  assignee: "Sreekesh Kamath",
  reviewer: "Sreekesh Kamath",
  labels: [],
  milestone: null,
  timeTracking: "No estimate or time spent",
  participants: ["Sreekesh Kamath"]
};

type Tab = 'Overview' | 'Commits' | 'Pipelines' | 'Changes';

export function MergeRequestsView() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview');

  const Label = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
      {children}
    </h3>
  );

  const MetadataRow = ({ label, value, icon: Icon, onEdit }: { label: string, value: string | React.ReactNode, icon?: any, onEdit?: () => void }) => (
    <div className="py-4 border-b border-zinc-900 group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
        {onEdit && (
          <button className="text-[9px] font-black text-zinc-700 hover:text-white uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
            Edit
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={12} className="text-zinc-600" />}
        <span className="text-[11px] font-mono text-zinc-300">
          {value || 'None'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="px-8 py-8 border-b border-zinc-800 bg-zinc-950/20">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white flex items-center gap-4">
              {mockMR.title}
              <span className="text-zinc-700 font-mono italic not-uppercase text-xl">{mockMR.id}</span>
            </h1>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest text-[10px] rounded-sm py-1">
                <GitPullRequest size={12} className="mr-1" />
                {mockMR.status}
              </Badge>
              <div className="text-[11px] font-mono text-zinc-500">
                <span className="text-zinc-300">{mockMR.author}</span> requested to merge
                <span className="mx-2 px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-mono">
                  {mockMR.sourceBranch}
                </span>
                into
                <span className="mx-2 px-1.5 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded font-mono">
                  {mockMR.targetBranch}
                </span>
                • {mockMR.requestedAt}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900">
              <Edit size={14} className="mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="h-9 border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900">
              Code
              <ChevronDown size={14} className="ml-2" />
            </Button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-6 mt-8">
          {(['Overview', 'Commits', 'Pipelines', 'Changes'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative
                ${activeTab === tab ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}
              `}
            >
              {tab}
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === tab ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-700'}`}>
                {tab === 'Overview' ? '0' : tab === 'Commits' ? '3' : tab === 'Pipelines' ? '0' : '5'}
              </span>
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" className="h-8 border-zinc-800 text-[9px] font-black uppercase tracking-widest hover:bg-zinc-900">
              Add a to-do item
            </Button>
            <Button className="h-8 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest hover:bg-primary/90">
              Your review
            </Button>
            <Button className="h-8 bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200">
              New Merge Request
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          <div className="max-w-4xl space-y-12">

            <section>
              <Label>Overview</Label>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                {mockMR.description}
              </p>
            </section>

            <section>
              <Label>
                <ExternalLink size={12} />
                Related Issue/Plan
              </Label>
              <div className="mt-4 p-4 border border-zinc-800 bg-zinc-900/30 rounded-lg flex items-center justify-between group cursor-pointer hover:border-zinc-700 transition-colors">
                <span className="text-[11px] font-mono text-zinc-300 italic">{mockMR.relatedIssue}</span>
                <ExternalLink size={12} className="text-zinc-600 group-hover:text-white transition-colors" />
              </div>
            </section>

            <section className="space-y-6">
              <Label>Changes</Label>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-zinc-900" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">API Integration</span>
                  <div className="h-[1px] flex-1 bg-zinc-900" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-mono text-zinc-300">Added API Route (<span className="text-primary/80 italic">lib/apiRoutes.ts</span>):</p>
                      <ul className="pl-4 border-l border-zinc-800 space-y-1 mt-2">
                        <li className="text-[11px] font-mono text-zinc-500">
                          Added <span className="text-zinc-300 font-bold">GET_PHOTO_THUMBNAILS</span> route pointing to
                          <span className="mx-2 px-1 py-0.5 bg-zinc-900 rounded">/photo/thumbnails</span> endpoint
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <div className="h-[1px] flex-1 bg-zinc-900" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">New Hook: <span className="text-primary">useThumbnails</span></span>
                  <div className="h-[1px] flex-1 bg-zinc-900" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-mono text-zinc-300">Created <span className="text-primary/80 italic">hooks/useThumbnails.ts</span>:</p>
                      <ul className="pl-4 border-l border-zinc-800 space-y-2 mt-2">
                        {[
                          'Custom React hook for fetching thumbnails with cursor-based pagination',
                          'Handles authentication via Bearer token from sessionStorage',
                          'Transforms API response to Asset[] format for compatibility with existing components',
                          'Provides loading states (isLoading, isLoadingMore), error handling, and pagination control',
                          'Exposes refresh() and loadMore() methods for manual control'
                        ].map((item, i) => (
                          <li key={i} className="text-[11px] font-mono text-zinc-500 flex items-start gap-2">
                            <span className="text-zinc-800">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="w-72 border-l border-zinc-800 bg-zinc-950/20 p-6 overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <MetadataRow label="Assignee" value={mockMR.assignee} icon={Users} onEdit={() => {}} />
            <MetadataRow label="Reviewer" value={mockMR.reviewer} icon={Users} onEdit={() => {}} />
            <MetadataRow label="Labels" value="None" icon={Tag} onEdit={() => {}} />
            <MetadataRow label="Milestone" value="None" icon={Milestone} onEdit={() => {}} />
            <MetadataRow label="Time tracking" value={mockMR.timeTracking} icon={Clock} />

            <div className="py-6">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-4">1 Participant</span>
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 uppercase">
                  SK
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
