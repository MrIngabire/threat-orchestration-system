import { useState } from 'react'
import axios from 'axios'

function App() {
  const [activePage, setActivePage] = useState('console')
  const [logs, setLogs] = useState(["System Ready. Awaiting commands..."])
  const [loading, setLoading] = useState(false)

  const addLog = (message) => setLogs((prev) => [...prev, `\n> ${message}`])

  const triggerAction = async (endpoint, actionName) => {
    setLoading(true)
    addLog(`Initiating: ${actionName}...`)
    try {
      const response = await axios.post(`http://127.0.0.1:8000/api/${endpoint}/`, {}, { timeout: 300000 })
      if (response.data.output) addLog(response.data.output)
      else if (response.data.message) addLog(response.data.message)
    } catch (error) {
      addLog(`ERROR: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    window.open('http://127.0.0.1:8000/api/download-matrix/', '_blank');
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans flex">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 hidden md:block sticky top-0 h-screen">
        <h2 className="text-xl font-bold text-cyan-400 mb-8 tracking-tight">Threat<br/>Orchestrator</h2>
        <nav className="space-y-4">
          <button onClick={() => setActivePage('overview')} className={`w-full text-left px-4 py-2 rounded transition-colors ${activePage === 'overview' ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
            System Overview
          </button>
          <button onClick={() => setActivePage('console')} className={`w-full text-left px-4 py-2 rounded transition-colors ${activePage === 'console' ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
            Orchestration Console
          </button>
          <button onClick={() => setActivePage('matrix')} className={`w-full text-left px-4 py-2 rounded transition-colors ${activePage === 'matrix' ? 'bg-cyan-900/30 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
            Configuration Matrix
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 max-w-6xl mx-auto">
        <header className="mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-white">Cloud Security Threat Orchestration System</h1>
          <p className="text-slate-400 mt-2">Zero Trust Architecture & SSRF Mitigation Testbed</p>
        </header>

        {/* PAGE 1: OVERVIEW */}
        {activePage === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 text-cyan-400">Project Architecture</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                This system acts as a proactive security sandbox. It uses Terraform to provision an ephemeral AWS environment simulating the 2019 Capital One SSRF vulnerability. 
              </p>
              <ul className="list-disc list-inside text-slate-400 space-y-2">
                <li><strong>Frontend:</strong> React & Tailwind CSS</li>
                <li><strong>Backend:</strong> Django REST Framework</li>
                <li><strong>Infrastructure:</strong> AWS (EC2, S3, IAM) & Terraform</li>
                <li><strong>Core Defense:</strong> Zero Trust / IMDSv2 Enforcement</li>
              </ul>
            </div>
          </div>
        )}

        {/* PAGE 2: ORCHESTRATION CONSOLE (The Main Tool) */}
        {activePage === 'console' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
            <div className="space-y-4 bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
              <h2 className="text-xl font-semibold mb-6">Execution Pipeline</h2>
              <button onClick={() => triggerAction('provision', 'Provision Infrastructure')} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-3 px-4 rounded font-medium">1. Provision Vulnerable Lab</button>
              <button onClick={() => triggerAction('simulate', 'Simulate SSRF Attack')} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white py-3 px-4 rounded font-medium">2. Execute SSRF Attack</button>
              <button onClick={() => triggerAction('mitigate', 'Enforce Zero Trust')} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white py-3 px-4 rounded font-medium">3. Apply Zero Trust Mitigation</button>
              <div className="pt-4 mt-4 border-t border-slate-700">
                <button onClick={() => triggerAction('destroy', 'Destroy Infrastructure')} disabled={loading} className="w-full bg-slate-900 border border-red-900 text-red-500 hover:bg-red-950 py-3 px-4 rounded">4. Teardown Sandbox</button>
              </div>
            </div>

            <div className="xl:col-span-2 bg-black rounded-lg p-4 border border-slate-700 shadow-xl flex flex-col h-[500px]">
              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-500 text-xs ml-2 font-mono">live_orchestration.log</span>
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-sm text-green-400 whitespace-pre-wrap">
                {logs.map((log, i) => <span key={i}>{log}</span>)}
                {loading && <span className="animate-pulse text-yellow-400">...</span>}
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: CONFIGURATION MATRIX */}
        {activePage === 'matrix' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-800 p-8 rounded-lg border border-emerald-900/50 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
              <h2 className="text-2xl font-bold mb-2 text-emerald-400">Zero Trust Configuration Matrix</h2>
              <p className="text-slate-300 mb-8 max-w-2xl">
                The Configuration Matrix is the final output of the orchestration system. It is a hardened, stress-tested Terraform template that guarantees the prevention of SSRF data exfiltration by enforcing IMDSv2.
              </p>
              
              <div className="bg-slate-950 p-6 rounded-md font-mono text-sm text-slate-300 mb-8 border border-slate-800">
                <p className="text-slate-500 mb-4">// Snippet: IMDSv2 Enforcement Rule</p>
                <p><span className="text-blue-400">resource</span> <span className="text-yellow-300">"aws_instance"</span> <span className="text-yellow-300">"hardened_node"</span> {'{'}</p>
                <p className="ml-4">metadata_options {'{'}</p>
                <p className="ml-8"><span className="text-cyan-300">http_tokens</span> = <span className="text-green-300">"required"</span> <span className="text-slate-500">// Blocks unauthenticated metadata queries</span></p>
                <p className="ml-4">{'}'}</p>
                <p>{'}'}</p>
              </div>

              <button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded shadow-lg transition-transform hover:-translate-y-0.5 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Download Configuration Matrix (.tf)
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default App