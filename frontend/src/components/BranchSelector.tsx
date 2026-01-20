/**
 * BranchSelector Component
 * 
 * This component provides a dropdown for selecting source and target branches
 * for creating review sessions.
 */

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, GitBranch, Check } from 'lucide-react';
import { PersistentRepoService } from '../services/PersistentRepoService';
import { BranchInfo } from '../types/reviewSession.types';

interface BranchSelectorProps {
  repositoryId: string;
  sourceBranch: string;
  targetBranch: string;
  onChange: (source: string, target: string) => void;
  disabled?: boolean;
}

export function BranchSelector({
  repositoryId,
  sourceBranch,
  targetBranch,
  onChange,
  disabled = false,
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (repositoryId && (sourceOpen || targetOpen)) {
      fetchBranches();
    }
  }, [repositoryId, sourceOpen, targetOpen]);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const branchList = await PersistentRepoService.getBranches(repositoryId);
      setBranches(branchList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSourceSelect = (branch: string) => {
    onChange(branch, targetBranch);
    setSourceOpen(false);
  };

  const handleTargetSelect = (branch: string) => {
    onChange(sourceBranch, branch);
    setTargetOpen(false);
  };

  const selectedSourceBranch = branches.find((b) => b.name === sourceBranch);
  const selectedTargetBranch = branches.find((b) => b.name === targetBranch);

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[9px]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Source Branch Selector */}
        <div className="relative">
          <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
            Source Branch
          </label>
          
          <button
            onClick={() => !disabled && setSourceOpen(!sourceOpen)}
            disabled={disabled}
            className={clsx(
              'w-full flex items-center justify-between px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded text-white text-[11px] focus:outline-none focus:border-zinc-600',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="flex items-center gap-2">
              <GitBranch size={12} className="text-zinc-500" />
              {sourceBranch || 'Select branch'}
            </span>
            <ChevronDown size={12} className={clsx('text-zinc-500 transition-transform', sourceOpen && 'rotate-180')} />
          </button>

          {/* Source Branch Dropdown */}
          {sourceOpen && (
            <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded shadow-lg max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-3 text-center text-[10px] text-zinc-500">
                  Loading...
                </div>
              ) : branches.length === 0 ? (
                <div className="p-3 text-center text-[10px] text-zinc-500">
                  No branches found
                </div>
              ) : (
                branches.map((branch) => (
                  <button
                    key={branch.name}
                    onClick={() => handleSourceSelect(branch.name)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 text-left text-[10px] hover:bg-zinc-800 transition-colors',
                      branch.name === sourceBranch ? 'bg-zinc-800 text-white' : 'text-zinc-300'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <GitBranch size={10} className="text-zinc-500" />
                      {branch.name}
                    </span>
                    {branch.name === sourceBranch && <Check size={10} />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Target Branch Selector */}
        <div className="relative">
          <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">
            Target Branch
          </label>
          
          <button
            onClick={() => !disabled && setTargetOpen(!targetOpen)}
            disabled={disabled}
            className={clsx(
              'w-full flex items-center justify-between px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded text-white text-[11px] focus:outline-none focus:border-zinc-600',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="flex items-center gap-2">
              <GitBranch size={12} className="text-zinc-500" />
              {targetBranch || 'Select branch'}
            </span>
            <ChevronDown size={12} className={clsx('text-zinc-500 transition-transform', targetOpen && 'rotate-180')} />
          </button>

          {/* Target Branch Dropdown */}
          {targetOpen && (
            <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded shadow-lg max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-3 text-center text-[10px] text-zinc-500">
                  Loading...
                </div>
              ) : branches.length === 0 ? (
                <div className="p-3 text-center text-[10px] text-zinc-500">
                  No branches found
                </div>
              ) : (
                branches.map((branch) => (
                  <button
                    key={branch.name}
                    onClick={() => handleTargetSelect(branch.name)}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 text-left text-[10px] hover:bg-zinc-800 transition-colors',
                      branch.name === targetBranch ? 'bg-zinc-800 text-white' : 'text-zinc-300'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <GitBranch size={10} className="text-zinc-500" />
                      {branch.name}
                    </span>
                    {branch.name === targetBranch && <Check size={10} />}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Branch Comparison Indicator */}
      {sourceBranch && targetBranch && sourceBranch !== targetBranch && (
        <div className="flex items-center gap-2 text-[9px] text-zinc-500">
          <GitBranch size={10} />
          <span>Comparing <strong className="text-zinc-400">{sourceBranch}</strong> against <strong className="text-zinc-400">{targetBranch}</strong></span>
        </div>
      )}
    </div>
  );
}

export default BranchSelector;
