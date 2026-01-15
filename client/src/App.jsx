import { useState, useEffect, useRef } from 'react'
import { Code2, Github, AlertTriangle, CheckCircle, XCircle, FileText, ChevronDown, ChevronUp, Trash2, RefreshCw, Search, Zap, Star, Save, FolderGit2, Terminal, Activity, Sparkles, Shield, TrendingUp } from 'lucide-react'
import axios from 'axios'

const API_BASE = 'http://localhost:3001/api'

const isValidRepoUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  const gitUrlPattern = /^(https?:\/\/|git@|git:\/\/).+/
  return gitUrlPattern.test(url.trim())
}

const HARDCODED_MODELS = [
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', price: 'paid' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', price: 'paid' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash', provider: 'Google', price: 'free' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', price: 'free' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', provider: 'Meta', price: 'free' },
  { id: 'google/gemini-2.0-flash-thinking-exp:free', name: 'Gemini 2.0 Thinking', provider: 'Google', price: 'free' },
]

function App() {
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [models, setModels] = useState([])
  const [filteredModels, setFilteredModels] = useState([])
  const [modelSearch, setModelSearch] = useState('')
  const [showFreeOnly, setShowFreeOnly] = useState(false)
  const [repoId, setRepoId] = useState(null)
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [savedRepos, setSavedRepos] = useState([])
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [activityLog, setActivityLog] = useState([])
  const [activityExpanded, setActivityExpanded] = useState(false)
  const [selectOpen, setSelectOpen] = useState(false)
  const selectRef = useRef(null)

  useEffect(() => {
    fetchModels()
    fetchSavedRepos()
  }, [])

  useEffect(() => {
    if (models.length > 0) {
      let filtered = models

      if (modelSearch) {
        const search = modelSearch.toLowerCase()
        filtered = filtered.filter(m =>
          m.name.toLowerCase().includes(search) ||
          m.id.toLowerCase().includes(search) ||
          m.provider.toLowerCase().includes(search)
        )
      }

      if (showFreeOnly) {
        filtered = filtered.filter(m => m.price === 'free')
      }

      setFilteredModels(filtered)
    }
  }, [models, modelSearch, showFreeOnly])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setSelectOpen(false)
      }
    }

    if (selectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectOpen])

  const addToLog = (type, message) => {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      message,
    }
    setActivityLog(prev => [entry, ...prev].slice(0, 100))
  }

  const clearLog = () => {
    setActivityLog([])
  }

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_BASE}/review/models`)
      const allModels = [...HARDCODED_MODELS, ...response.data]
      setModels(allModels)
      setFilteredModels(allModels)
      if (allModels.length > 0) {
        setSelectedModel(allModels[0].id)
      }
    } catch (err) {
      setModels(HARDCODED_MODELS)
      setFilteredModels(HARDCODED_MODELS)
      if (HARDCODED_MODELS.length > 0) {
        setSelectedModel(HARDCODED_MODELS[0].id)
      }
    }
  }

  const fetchSavedRepos = async () => {
    try {
      const response = await axios.get(`${API_BASE}/saved-repos`)
      setSavedRepos(response.data.repos || [])
    } catch (err) {
      console.error('Failed to fetch saved repos:', err)
    }
  }

  const cloneRepository = async () => {
    if (!repoUrl) {
      setError('Please enter a repository URL')
      return
    }

    if (!isValidRepoUrl(repoUrl)) {
      setError('Please enter a valid Git repository URL')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    addToLog('info', `Cloning repository: ${repoUrl}`)

    try {
      const response = await axios.post(`${API_BASE}/repo/clone`, {
        repoUrl,
        branch: branch || undefined
      })

      setRepoId(response.data.repoId)
      setFiles(response.data.files || [])
      console.log('Cloned files:', response.data.files?.length || 0)
      
      if (response.data.cached) {
        addToLog('info', `Using cached repository (${response.data.files?.length || 0} files)`)
      } else {
        addToLog('success', `Successfully cloned ${response.data.files?.length || 0} files`)
      }
      
      if (!response.data.files || response.data.files.length === 0) {
        addToLog('warning', 'No files found in repository')
      }
    } catch (err) {
      console.error('Clone error:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Failed to clone repository'
      addToLog('error', errorMsg)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const syncRepository = async () => {
    if (!repoId) return
    setSyncing(true)
    setError(null)
    try {
      const response = await axios.post(`${API_BASE}/repo/clone`, {
        repoUrl,
        branch: branch || undefined
      })
      setFiles(response.data.files)
      addToLog('success', `Sync complete. ${response.data.files.length} files`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync repository')
    } finally {
      setSyncing(false)
    }
  }

  const analyzeCode = async () => {
    if (!selectedFiles.length) {
      setError('Please select at least one file to analyze')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      const response = await axios.post(`${API_BASE}/review/analyze`, {
        repoId,
        model: selectedModel,
        files: selectedFiles.map(f => ({ path: f.path }))
      })

      setResults(response.data)
      addToLog('success', `Review complete! Score: ${response.data.summary.overallScore}/100`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze code')
    } finally {
      setAnalyzing(false)
    }
  }

  const saveRepository = async () => {
    if (!repoUrl || !isValidRepoUrl(repoUrl)) return
    try {
      await axios.post(`${API_BASE}/saved-repos`, {
        url: repoUrl,
        branch: branch || 'main',
        name: saveName || undefined
      })
      setShowSaveForm(false)
      fetchSavedRepos()
      addToLog('success', 'Repository saved successfully')
    } catch (err) {
      setError('Failed to save repository')
    }
  }

  const deleteSavedRepo = async (id, e) => {
    e.stopPropagation()
    try {
      await axios.delete(`${API_BASE}/saved-repos/${id}`)
      fetchSavedRepos()
    } catch (err) {
      setError('Failed to delete repository')
    }
  }

  const loadSavedRepo = (repo) => {
    setRepoUrl(repo.url)
    setBranch(repo.branch)
    addToLog('info', `Loaded repository: ${repo.name}`)
  }

  const toggleFileSelection = (file) => {
    setSelectedFiles(prev => {
      const exists = prev.find(f => f.path === file.path)
      if (exists) return prev.filter(f => f.path !== file.path)
      return [...prev, file]
    })
  }

  const selectAllFiles = () => {
    setSelectedFiles([...files])
  }

  const deselectAllFiles = () => {
    setSelectedFiles([])
  }

  const clearRepository = () => {
    setRepoId(null)
    setFiles([])
    setSelectedFiles([])
    setResults(null)
    setRepoUrl('')
    setBranch('')
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getLogColor = (type) => {
    switch (type) {
      case 'info': return 'text-blue-400'
      case 'success': return 'text-emerald-400'
      case 'error': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      default: return 'text-slate-400'
    }
  }

  const selectedModelData = models.find(m => m.id === selectedModel)

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-slate-700/50 bg-[#1e293b]/50 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-2xl z-10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Code2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AI CODE REVIEWER
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Autonomous Security Analysis</p>
          </div>
        </div>
        <button
          onClick={() => setActivityExpanded(!activityExpanded)}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-semibold border ${
            activityExpanded 
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <Activity className="h-4 w-4" />
          ACTIVITY
          {activityLog.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold animate-pulse">
              {activityLog.length}
            </span>
          )}
        </button>
      </header>

      {/* Activity Log */}
      {activityExpanded && (
        <div className="border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-xl max-h-48 overflow-hidden flex flex-col shadow-inner animate-in">
          <div className="flex items-center justify-between px-6 py-2 bg-slate-800/50 border-b border-slate-700/30">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <Terminal className="h-3 w-3" /> System Logs
            </div>
            <button onClick={clearLog} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors">CLEAR LOGS</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
            {activityLog.length === 0 ? (
              <div className="text-center text-slate-600 py-4 italic">No system activity detected...</div>
            ) : (
              activityLog.map(entry => (
                <div key={entry.id} className="flex gap-4 py-0.5 group">
                  <span className="text-slate-600 shrink-0">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                  <span className={`${getLogColor(entry.type)} group-hover:brightness-125 transition-all`}>{entry.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 border-r border-slate-700/30 bg-[#0f172a] overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            {/* Saved Repos */}
            {savedRepos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <FolderGit2 className="h-3 w-3" /> Saved Repos
                </div>
                <div className="space-y-2">
                  {savedRepos.filter(repo => isValidRepoUrl(repo.url)).map(repo => (
                    <div
                      key={repo.id}
                      onClick={() => loadSavedRepo(repo)}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                        repoUrl === repo.url 
                          ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
                          : 'bg-slate-800/20 border-slate-700/30 hover:border-slate-600 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-200 truncate">{repo.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{repo.branch}</div>
                        </div>
                        <button onClick={(e) => deleteSavedRepo(repo.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all">
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Config Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <Search className="h-3 w-3" /> Configuration
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target URL</label>
                  <input
                    type="text"
                    placeholder="https://github.com/..."
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Branch Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700/50 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700"
                    />
                    <button onClick={syncRepository} disabled={!repoId || syncing} className="p-3 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all disabled:opacity-20">
                      <RefreshCw className={`h-4 w-4 text-slate-400 ${syncing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={cloneRepository}
                  disabled={loading || !repoUrl}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      CLONING...
                    </>
                  ) : (
                    'CLONE REPOSITORY'
                  )}
                </button>
                
                {files.length > 0 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold text-center">
                    ✓ {files.length} files ready for analysis
                  </div>
                )}
                
                {repoId && (
                  <div className="p-2 bg-slate-900/50 border border-slate-700/30 rounded-lg text-[10px] text-slate-500 text-center font-mono">
                    Repo ID: {repoId.slice(0, 8)}...
                  </div>
                )}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4 p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Cloning repository...</span>
                </div>
              </div>
            )}

            {/* Model Selection */}
            {!loading && files.length > 0 && (
              <div className="space-y-6 animate-in">
                <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <Zap className="h-3 w-3" /> Analysis Model
                </div>
                
                <div className="relative" ref={selectRef}>
                  <button onClick={() => setSelectOpen(!selectOpen)} className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between text-xs font-bold text-slate-300">
                    {selectedModelData?.name || 'Select Engine'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${selectOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {selectOpen && (
                    <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="max-h-48 overflow-y-auto">
                        {filteredModels.map(model => (
                          <button
                            key={model.id}
                            onClick={() => { setSelectedModel(model.id); setSelectOpen(false); }}
                            className={`w-full p-4 text-left text-xs font-bold hover:bg-indigo-600 transition-colors border-b border-slate-700/50 last:border-0 ${selectedModel === model.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400'}`}
                          >
                            {model.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Target Selection ({selectedFiles.length}/{files.length})</span>
                    <div className="flex gap-2">
                      <button onClick={selectAllFiles} className="hover:text-indigo-400 transition-colors">All</button>
                      <button onClick={deselectAllFiles} className="hover:text-indigo-400 transition-colors">None</button>
                    </div>
                  </div>
                  <div className="h-48 bg-slate-900 border border-slate-700 rounded-xl overflow-y-auto p-2 custom-scrollbar">
                    {files.length === 0 ? (
                      <div className="text-center text-slate-600 py-8 text-xs">No files available</div>
                    ) : (
                      files.map(file => (
                        <div
                          key={file.path}
                          onClick={() => toggleFileSelection(file)}
                          className={`p-2.5 rounded-lg text-[10px] font-mono cursor-pointer transition-all flex items-center gap-3 ${
                            selectedFiles.find(f => f.path === file.path) ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${selectedFiles.find(f => f.path === file.path) ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-800'}`} />
                          <span className="truncate">{file.path}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={analyzeCode}
                  disabled={analyzing || selectedFiles.length === 0}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-20"
                >
                  {analyzing ? 'REVIEWING...' : 'START ANALYSIS'}
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 bg-[#020617] overflow-y-auto relative custom-scrollbar">
          {results ? (
            <div className="p-10 max-w-5xl mx-auto space-y-10 animate-in">
              <div className="grid grid-cols-3 gap-6">
                <div className="p-8 bg-[#1e293b]/30 border border-slate-700/50 rounded-3xl backdrop-blur-sm text-center space-y-2">
                  <div className={`text-7xl font-black ${getScoreColor(results.summary.overallScore)}`}>{results.summary.overallScore}</div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Overall Rating</div>
                </div>
                <div className="p-8 bg-[#1e293b]/30 border border-slate-700/50 rounded-3xl backdrop-blur-sm text-center space-y-2">
                  <div className="text-7xl font-black text-indigo-400">{results.summary.totalFiles}</div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Files Analyzed</div>
                </div>
                <div className={`p-8 border rounded-3xl backdrop-blur-sm text-center space-y-2 ${results.summary.vulnerabilityCount > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                  <div className={`text-7xl font-black ${results.summary.vulnerabilityCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{results.summary.vulnerabilityCount}</div>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Security Risks</div>
                </div>
              </div>

              <div className="space-y-6">
                {results.results.map((result, idx) => (
                  <ResultCard key={idx} result={result} getScoreColor={getScoreColor} />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-6 text-slate-700">
              <div className="relative">
                <FileText className="h-24 w-24 opacity-[0.03]" />
                <Sparkles className="h-8 w-8 absolute -top-2 -right-2 text-indigo-500 opacity-20 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">System Idle</h2>
                <p className="text-xs font-medium max-w-xs text-slate-600/50 leading-relaxed">Clone a repository to begin automated security analysis and code quality review.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function ResultCard({ result, getScoreColor }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-[#1e293b]/20 border border-slate-700/30 rounded-3xl overflow-hidden transition-all hover:border-slate-600/50 shadow-2xl">
      <div onClick={() => setExpanded(!expanded)} className="p-6 flex items-center justify-between cursor-pointer group">
        <div className="flex items-center gap-6 min-w-0 flex-1">
          <span className="font-mono text-sm text-slate-400 truncate group-hover:text-slate-200 transition-colors">{result.file}</span>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 bg-slate-900 rounded-lg text-xs font-black ${getScoreColor(result.score)} shadow-inner`}>{result.score}</span>
            {result.vulnerabilities?.length > 0 && (
              <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-black flex items-center gap-1.5 border border-red-500/20">
                <Shield className="h-3.5 w-3.5" /> {result.vulnerabilities.length} RISKS
              </span>
            )}
          </div>
        </div>
        <div className="p-2 rounded-full bg-slate-800/50 group-hover:bg-slate-700 transition-all">
          {expanded ? <ChevronUp className="h-5 w-5 text-slate-500" /> : <ChevronDown className="h-5 w-5 text-slate-500" />}
        </div>
      </div>

      {expanded && (
        <div className="p-8 space-y-8 border-t border-slate-700/30 bg-[#0f172a]/50">
          {result.summary && (
            <div className="space-y-3">
              <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Analysis Overview</div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">{result.summary}</p>
            </div>
          )}

          {result.issues?.length > 0 && (
            <div className="space-y-6">
              <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Detected Issues</div>
              <div className="grid gap-4">
                {result.issues.map((issue, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 group hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded text-white ${issue.severity === 'high' || issue.severity === 'critical' ? 'bg-red-500' : issue.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-500'}`}>{issue.severity}</span>
                      <span className="text-sm font-bold text-slate-300">{issue.type}</span>
                      <span className="text-xs text-slate-600 font-mono">Line {issue.line}</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">{issue.message}</p>
                    
                    {issue.code && (
                      <code className="block p-4 mb-4 rounded-xl bg-black/50 text-[11px] text-blue-300/80 font-mono leading-relaxed border border-slate-800 break-all overflow-x-auto">
                        {issue.code}
                      </code>
                    )}

                    {issue.suggestion && (
                      <div className="pl-4 border-l-2 border-indigo-500/30">
                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Recommendation</div>
                        <p className="text-sm text-slate-500 italic">{issue.suggestion}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.vulnerabilities?.length > 0 && (
            <div className="space-y-6">
              <div className="text-xs font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Shield className="h-4 w-4" /> Security Breach Points
              </div>
              <div className="grid gap-4">
                {result.vulnerabilities.map((vuln, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-black bg-red-500 text-white px-2.5 py-1 rounded uppercase tracking-widest">{vuln.severity}</span>
                      <span className="text-sm font-bold text-slate-300">{vuln.type}</span>
                    </div>
                    <code className="block p-4 rounded-xl bg-black text-[11px] text-red-300/80 font-mono leading-relaxed border border-red-900/30 break-all">{vuln.code}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
