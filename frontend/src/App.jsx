import { useState, useEffect } from 'react'
import axios from 'axios'

// --- CUSTOM SVG LOGO COMPONENT ---
const Logo = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" className="text-slate-500" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="text-emerald-500 animate-pulse" />
  </svg>
)

function App() {
  const [hasEntered, setHasEntered] = useState(false)
  const [activePage, setActivePage] = useState('console')
  const [logs, setLogs] = useState(["System Ready. Awaiting commands..."])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const addLog = (message) => setLogs((prev) => [...prev, `\n> ${message}`])

  const triggerAction = async (endpoint, actionName) => {
    setLoading(true)
    addLog(`Initiating: ${actionName}...`)
    try {
      const formData = new FormData()
      if (endpoint === 'provision' && selectedFile) {
        formData.append('deployment_file', selectedFile)
        addLog(`Uploading custom deployment file: ${selectedFile.name}`)
      }
      const response = await axios.post(
        `http://127.0.0.1:8000/api/${endpoint}/`, 
        formData, 
        { timeout: 300000, headers: { 'Content-Type': 'multipart/form-data' } }
      )
      if (response.data.output) addLog(response.data.output)
      else if (response.data.message) addLog(response.data.message)
      if (response.data.public_ip) addLog(`Target IP acquired: ${response.data.public_ip}`)
    } catch (error) {
      addLog(`ERROR: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => window.open('http://127.0.0.1:8000/api/download-matrix/', '_blank')

  // --- WELCOME SCREEN RENDER ---
  if (!hasEntered) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans">
        
        {/* Inline CSS for Moving Diagonal Diamonds */}
        <style>
          {`
            @keyframes diagonal-move {
              0% { background-position: 0 0; }
              100% { background-position: 40px 40px; }
            }
            .moving-diamonds {
              background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='20,17 23,20 20,23 17,20' fill='%2310b981' fill-opacity='0.3' /%3E%3C/svg%3E");
              animation: diagonal-move 6s linear infinite;
            }
          `}
        </style>

        {/* Animated Diamond Background */}
        <div className="absolute inset-0 moving-diamonds [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none"></div>
        
        {/* Green Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-8 animate-fade-in-up">
          <Logo className="w-32 h-32 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 tracking-tight">
              Threat Orchestrator
            </h1>
            <p className="text-emerald-500/80 text-lg font-mono tracking-widest uppercase">
              Zero Trust Architecture Sandbox
            </p>
          </div>

          <button 
            onClick={() => setHasEntered(true)}
            className="mt-12 group relative px-8 py-4 bg-transparent overflow-hidden rounded-md border border-emerald-500/50 hover:border-emerald-400 transition-all duration-300"
          >
            <div className="absolute inset-0 w-0 bg-emerald-900/40 transition-all duration-500 ease-out group-hover:w-full"></div>
            <span className="relative flex items-center gap-3 text-emerald-400 font-mono font-semibold tracking-wider group-hover:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              INITIALIZE SYSTEM
            </span>
          </button>
        </div>
      </div>
    )
  }

  // --- MAIN DASHBOARD RENDER ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans flex animate-fade-in">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <Logo className="w-10 h-10" />
          <h2 className="text-xl font-bold text-emerald-400 tracking-tight leading-tight">Threat<br/>Orchestrator</h2>
        </div>
        <nav className="space-y-3 flex-1">
          <button onClick={() => setActivePage('overview')} className={`w-full text-left px-4 py-3 rounded-md transition-all ${activePage === 'overview' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            System Overview
          </button>
          <button onClick={() => setActivePage('console')} className={`w-full text-left px-4 py-3 rounded-md transition-all ${activePage === 'console' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            Orchestration Console
          </button>
          <button onClick={() => setActivePage('matrix')} className={`w-full text-left px-4 py-3 rounded-md transition-all ${activePage === 'matrix' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
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
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 text-emerald-400">Project Architecture</h2>
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

        {/* PAGE 2: ORCHESTRATION CONSOLE */}
        {activePage === 'console' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in-up">
            <div className="space-y-4 bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
              <h2 className="text-xl font-semibold mb-6">Execution Pipeline</h2>
              
              <div className="mb-4 border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-emerald-500 transition-colors bg-slate-900/50">
                <input type="file" id="file-upload" className="hidden" accept=".tf" onChange={(e) => setSelectedFile(e.target.files[0])} />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <span className="text-sm text-slate-300 font-mono">
                    {selectedFile ? selectedFile.name : "Upload Terraform (.tf)"}
                  </span>
                </label>
              </div>

              <button onClick={() => triggerAction('provision', 'Provision Infrastructure')} disabled={loading} className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 border border-slate-500 text-white py-3 px-4 rounded font-medium transition-colors">1. Provision Lab</button>
              <button onClick={() => triggerAction('simulate', 'Simulate SSRF Attack')} disabled={loading} className="w-full bg-red-900/80 hover:bg-red-800 disabled:bg-slate-800 border border-red-700 text-red-100 py-3 px-4 rounded font-medium transition-colors">2. Execute Attack</button>
              <button onClick={() => triggerAction('mitigate', 'Enforce Zero Trust')} disabled={loading} className="w-full bg-emerald-900/80 hover:bg-emerald-800 disabled:bg-slate-800 border border-emerald-700 text-emerald-100 py-3 px-4 rounded font-medium transition-colors">3. Apply Mitigation</button>
              
              <div className="pt-4 mt-4 border-t border-slate-700">
                <button onClick={() => triggerAction('destroy', 'Destroy Infrastructure')} disabled={loading} className="w-full bg-black border border-red-900/50 text-red-500 hover:bg-red-950/30 py-3 px-4 rounded transition-colors">4. Teardown Sandbox</button>
              </div>
            </div>

            <div className="xl:col-span-2 bg-black rounded-lg p-4 border border-slate-700 shadow-xl flex flex-col h-[550px]">
              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-800">
                <div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-slate-500 text-xs ml-2 font-mono">live_orchestration.log</span>
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-sm text-emerald-400 whitespace-pre-wrap">
                {logs.map((log, i) => <span key={i}>{log}</span>)}
                {loading && <span className="animate-pulse text-yellow-400">...</span>}
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: CONFIGURATION MATRIX */}
        {activePage === 'matrix' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-slate-800 p-8 rounded-lg border border-emerald-900/50 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
              <h2 className="text-2xl font-bold mb-2 text-emerald-400">Zero Trust Configuration Matrix</h2>
              <p className="text-slate-300 mb-8 max-w-2xl">
                The Configuration Matrix is dynamically generated based on the successful mitigation traits applied during the current orchestration session.
              </p>
              
              <div className="bg-slate-950 p-6 rounded-md font-mono text-sm text-slate-300 mb-8 border border-slate-800">
                <p className="text-slate-500 mb-4">// Snippet: IMDSv2 Enforcement Rule</p>
                <p><span className="text-blue-400">resource</span> <span className="text-yellow-300">"aws_instance"</span> <span className="text-yellow-300">"hardened_node"</span> {'{'}</p>
                <p className="ml-4">metadata_options {'{'}</p>
                <p className="ml-8"><span className="text-cyan-300">http_tokens</span> = <span className="text-green-300">"required"</span></p>
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