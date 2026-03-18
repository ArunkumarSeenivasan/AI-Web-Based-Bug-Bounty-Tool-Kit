import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Globe, 
  FileText, 
  AlertTriangle, 
  ChevronRight, 
  Loader2,
  Code,
  Cpu,
  Activity,
  Layers,
  Skull
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCheatSheets } from './services/geminiService';
import axios from 'axios';

// --- Types ---
interface ScanResult {
  port?: number;
  subdomain?: string;
  path?: string;
  status: string | number;
  statusText?: string;
  connection?: string;
  addresses?: string[];
  address?: string;
  family?: string;
  length?: string;
  duration?: number;
  message?: string;
  type?: string;
}

interface CheatSheet {
  name: string;
  payloads: string[];
  context: string;
  purpose: string;
  explanation: string;
}

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  disabled, 
  variant = 'primary',
  className = "" 
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  disabled?: boolean,
  variant?: 'primary' | 'secondary' | 'danger',
  className?: string
}) => {
  const variants = {
    primary: 'bg-stone-900 text-white hover:bg-stone-800',
    secondary: 'bg-stone-100 text-stone-900 hover:bg-stone-200 border border-stone-200',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  className = ""
}: { 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  placeholder?: string,
  type?: string,
  className?: string
}) => (
  <input 
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all ${className}`}
  />
);

export default function App() {
  const [activeTab, setActiveTab] = useState('ports');
  const [target, setTarget] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [verboseMode, setVerboseMode] = useState(true);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [cheatSheets, setCheatSheets] = useState<CheatSheet[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);

  useEffect(() => {
    loadCheatSheets();
  }, []);

  const loadCheatSheets = async () => {
    setLoadingSheets(true);
    try {
      const sheets = await getCheatSheets();
      if (sheets && sheets.length > 0) {
        setCheatSheets(sheets);
      } else {
        // Fallback static data if AI fails
        setCheatSheets([
          {
            name: "SQL Injection (SQLi)",
            payloads: ["' OR 1=1 --", "admin' --", "1' UNION SELECT NULL--"],
            context: "Login forms, search bars, URL parameters",
            purpose: "Bypass authentication or extract database information",
            explanation: "Injects SQL commands into input fields to manipulate backend queries."
          },
          {
            name: "Cross-Site Scripting (XSS)",
            payloads: ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>"],
            context: "Comment sections, user profiles, search results",
            purpose: "Execute malicious scripts in other users' browsers",
            explanation: "Injects client-side scripts that are executed when other users view the page."
          },
          {
            name: "Local File Inclusion (LFI)",
            payloads: ["../../../../etc/passwd", "..\\..\\..\\windows\\win.ini"],
            context: "File download/upload features, template engines",
            purpose: "Read sensitive files from the server's local file system",
            explanation: "Exploits insecure file handling to access files outside the intended directory."
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to load cheat sheets:", err);
    }
    setLoadingSheets(false);
  };

  const runPortScan = async () => {
    if (!target) return;
    setIsScanning(true);
    setResults([]);
    try {
      // Common 100 ports for demo, real scan would take longer
      const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443];
      const res = await axios.post('/api/scan/ports', { host: target, ports: commonPorts });
      setResults(res.data.results);
    } catch (err) {
      console.error(err);
    }
    setIsScanning(false);
  };

  const runSubdomainScan = async () => {
    if (!target) return;
    setIsScanning(true);
    setResults([]);
    try {
      const subs = ['www', 'dev', 'api', 'stage', 'test', 'admin', 'mail', 'shop', 'blog', 'vpn'];
      const res = await axios.post('/api/scan/subdomains', { domain: target, subdomains: subs });
      setResults(res.data.results);
    } catch (err) {
      console.error(err);
    }
    setIsScanning(false);
  };

  const runPathScan = async () => {
    if (!target) return;
    setIsScanning(true);
    setResults([]);
    try {
      const paths = [
        '.env', 'admin', 'config.php', 'wp-admin', 'api/v1', '.git/config', 'etc/passwd', 'robots.txt',
        'backup', 'db', 'sql', 'test', 'dev', 'staging', 'old', 'new', 'v1', 'v2', 'api', 'graphql',
        '.htaccess', '.htpasswd', 'phpinfo.php', 'info.php', 'status', 'server-status', 'config',
        'settings', 'setup', 'install', 'upload', 'files', 'images', 'assets', 'css', 'js', 'scripts',
        'logs', 'error_log', 'access_log', 'debug', 'trace', 'tmp', 'temp', 'cache', 'private',
        'secret', 'password', 'users', 'accounts', 'profile', 'dashboard', 'console', 'shell',
        'cmd', 'exec', 'ping', 'health', 'metrics', 'prometheus', 'actuator', 'swagger', 'docs',
        'readme.md', 'license.txt', 'package.json', 'composer.json', 'docker-compose.yml', 'dockerfile',
        '.dockerignore', '.gitignore', '.env.local', '.env.dev', '.env.prod', 'web.config', 'web.xml',
        'server.xml', 'application.properties', 'application.yml', 'bootstrap.yml', 'config.json',
        'database.sql', 'dump.sql', 'backup.sql', 'backup.zip', 'backup.tar.gz', 'backup.bak',
        'index.php.bak', 'index.html.bak', 'main.js.map', 'app.js.map', 'vendor', 'node_modules',
        'bower_components', 'dist', 'build', 'out', 'target', 'bin', 'obj', 'src', 'include',
        'lib', 'modules', 'plugins', 'themes', 'templates', 'views', 'layouts', 'partials'
      ];
      const res = await axios.post('/api/scan/paths', { url: target, paths });
      setResults(res.data.results);
    } catch (err) {
      console.error(err);
    }
    setIsScanning(false);
  };

  const getExploitStrategies = () => {
    const strategies = [
      {
        id: 1,
        name: "Port-Based Service Exploitation",
        description: "Targeting specific services running on open ports.",
        methodology: "Identify service versions (e.g., SSH, MySQL, HTTP) and search for known CVEs or misconfigurations.",
        relevance: results.some(r => r.port && r.status === 'open') ? "High (Open ports found)" : "General",
        steps: [
          "Banner grabbing to identify service versions.",
          "Check for default credentials (e.g., admin/admin for 8080).",
          "Search Exploit-DB for version-specific vulnerabilities."
        ]
      },
      {
        id: 2,
        name: "Subdomain Takeover",
        description: "Claiming unused subdomains pointing to external services.",
        methodology: "Check subdomains pointing to cloud providers (AWS, GitHub, Heroku) that return 404 or 'No such bucket'.",
        relevance: results.some(r => r.subdomain && r.status === 'found') ? "High (Subdomains found)" : "General",
        steps: [
          "Enumerate subdomains using DNS lookups.",
          "Check CNAME records for external service pointers.",
          "Verify if the external service is actually configured."
        ]
      },
      {
        id: 3,
        name: "Sensitive File Exposure",
        description: "Accessing configuration or backup files via path traversal.",
        methodology: "Bruteforce common paths to find .env, .git, or backup files containing credentials.",
        relevance: results.some(r => r.path && r.status === 200) ? "High (Sensitive paths found)" : "General",
        steps: [
          "Scan for common sensitive filenames.",
          "Check for directory listing enabled on folders.",
          "Analyze discovered files for API keys or DB strings."
        ]
      },
      {
        id: 4,
        name: "Credential Stuffing",
        description: "Using leaked credentials across various login portals.",
        methodology: "Identify login pages (found via path scan) and test common or leaked user/pass combinations.",
        relevance: results.some(r => r.path && (r.path.includes('admin') || r.path.includes('login'))) ? "High (Login pages found)" : "General",
        steps: [
          "Locate authentication endpoints.",
          "Gather usernames from public sources or subdomains.",
          "Automate login attempts with rate-limiting awareness."
        ]
      },
      {
        id: 5,
        name: "API Endpoint Manipulation",
        description: "Exploiting insecure API endpoints for data exfiltration.",
        methodology: "Test API routes (v1, v2, graphql) for IDOR or lack of authentication.",
        relevance: results.some(r => r.path && r.path.includes('api')) ? "High (API paths found)" : "General",
        steps: [
          "Map out API structure and parameters.",
          "Test for Insecure Direct Object Reference (IDOR).",
          "Check for sensitive data in API error responses."
        ]
      },
      {
        id: 6,
        name: "SQL Injection (SQLi)",
        description: "Injecting malicious SQL queries into input fields.",
        methodology: "Test parameters on discovered pages for database error messages or time delays.",
        relevance: results.some(r => r.path && (r.path.includes('php') || r.path.includes('sql'))) ? "Medium (Dynamic paths found)" : "General",
        steps: [
          "Identify input vectors (URL params, forms).",
          "Use single quotes or boolean logic to test for errors.",
          "Automate extraction using tools like sqlmap."
        ]
      },
      {
        id: 7,
        name: "Cross-Site Scripting (XSS)",
        description: "Injecting scripts to execute in other users' browsers.",
        methodology: "Find reflected parameters in subdomains or paths and test for script execution.",
        relevance: "General (Applies to most web targets)",
        steps: [
          "Find reflected inputs in the UI.",
          "Test for basic payload reflection (e.g., <script>alert(1)</script>).",
          "Bypass WAFs using encoding or alternative tags."
        ]
      },
      {
        id: 8,
        name: "Insecure Server Headers",
        description: "Leveraging information leaked in HTTP headers.",
        methodology: "Analyze headers like Server, X-Powered-By to identify backend technology.",
        relevance: results.some(r => r.type) ? "High (Header data available)" : "General",
        steps: [
          "Inspect HTTP response headers.",
          "Identify outdated server software versions.",
          "Check for missing security headers (HSTS, CSP)."
        ]
      },
      {
        id: 9,
        name: "Cloud Storage Misconfiguration",
        description: "Accessing public S3 buckets or blobs.",
        methodology: "Search for bucket names matching subdomains or target keywords.",
        relevance: results.some(r => r.subdomain && (r.subdomain.includes('s3') || r.subdomain.includes('storage'))) ? "High (Storage subdomains found)" : "General",
        steps: [
          "Identify bucket naming patterns.",
          "Test for public read/write permissions.",
          "List bucket contents for sensitive data."
        ]
      },
      {
        id: 10,
        name: "Server-Side Request Forgery (SSRF)",
        description: "Forcing the server to make requests to internal resources.",
        methodology: "Test parameters that fetch external URLs (e.g., webhooks, image fetchers).",
        relevance: results.some(r => r.path && r.path.includes('proxy')) ? "Medium (Proxy-like paths found)" : "General",
        steps: [
          "Find parameters that accept URLs.",
          "Attempt to request localhost (127.0.0.1) or internal IPs.",
          "Access cloud metadata services (e.g., 169.254.169.254)."
        ]
      }
    ];
    return strategies;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-stone-900 font-sans selection:bg-stone-200">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-stone-200 p-6 flex flex-col gap-8 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Web based<br/>Bug-bounty Tool-kit</h1>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {[
            { id: 'ports', label: 'Port Scanner', icon: Cpu },
            { id: 'subdomains', label: 'Subdomains', icon: Globe },
            { id: 'paths', label: 'Path Traversal', icon: Layers },
            { id: 'exploits', label: 'Exploit Strategies', icon: Skull },
            { id: 'cheatsheets', label: 'Cheat Sheets', icon: FileText },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10' 
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          {/* Student project box removed */}
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-64 p-10 max-w-6xl">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <p className="text-stone-500">
              {activeTab === 'ports' && 'Scan for open ports on a target host.'}
              {activeTab === 'subdomains' && 'Enumerate subdomains for a given domain.'}
              {activeTab === 'paths' && 'Discover hidden directories and sensitive files.'}
              {activeTab === 'exploits' && 'Strategic exploitation paths based on scan results.'}
              {activeTab === 'cheatsheets' && 'Quick reference for common bug bounty techniques.'}
            </p>
          </div>
          
          {['ports', 'subdomains', 'paths'].includes(activeTab) && (
            <div className="flex flex-col gap-2 w-96">
              <div className="flex gap-2">
                <Input 
                  value={target} 
                  onChange={(e) => setTarget(e.target.value)} 
                  placeholder="Enter target (e.g. google.com)"
                />
                <Button 
                  onClick={
                    activeTab === 'ports' ? runPortScan : 
                    activeTab === 'subdomains' ? runSubdomainScan : 
                    runPathScan
                  }
                  disabled={isScanning || !target}
                >
                  {isScanning ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                  Scan
                </Button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={verboseMode} 
                  onChange={(e) => setVerboseMode(e.target.checked)}
                  className="w-4 h-4 accent-stone-900"
                />
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Verbose Mode (Show all results)</span>
              </label>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {['ports', 'subdomains', 'paths'].includes(activeTab) && (
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-bottom border-stone-200">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">
                          {activeTab === 'ports' ? 'Port' : activeTab === 'subdomains' ? 'Subdomain' : 'Path'}
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Response Time</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-stone-400 italic">
                            {isScanning ? 'Scanning in progress...' : 'No results to display. Enter a target and click Scan.'}
                          </td>
                        </tr>
                      ) : (
                        results
                          .filter(res => verboseMode || res.status === 'OPEN' || res.status === 'FOUND' || (typeof res.status === 'number' && res.status < 400))
                          .map((res, i) => (
                          <tr key={i} className="hover:bg-stone-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm">
                              {res.port || res.subdomain || res.path}
                            </td>
            <td className="px-6 py-4">
              <div className="flex flex-col gap-1">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase w-fit ${
                  res.status === 'OPEN' || res.status === 'FOUND' || (typeof res.status === 'number' && res.status < 400)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {res.status}
                </span>
                {res.statusText && (
                  <span className="text-[9px] text-stone-400 font-medium truncate max-w-[120px]">
                    {res.statusText}
                  </span>
                )}
              </div>
            </td>
                            <td className="px-6 py-4 text-xs font-mono text-stone-400">
                              {res.duration ? `${res.duration}ms` : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-500">
                              <div className="flex flex-col gap-1">
                                {res.statusText && <span className="text-xs font-semibold text-stone-700">{res.statusText}</span>}
                                {res.message && <span className="text-xs italic text-stone-400">{res.message}</span>}
                                {res.address && <span className="font-mono text-xs">{res.address} (IPv{res.family})</span>}
                                {res.addresses && <span className="text-xs">{res.addresses.join(', ')}</span>}
                                {res.length && <span className="text-xs">{res.length} bytes</span>}
                                {res.type && <span className="text-[10px] text-stone-400 bg-stone-50 px-1 rounded border border-stone-100 w-fit">{res.type}</span>}
                                {res.connection === 'Failed' && <span className="text-[9px] text-red-400 font-bold uppercase">Connection Failed</span>}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {activeTab === 'exploits' && (
              <div className="flex flex-col gap-6">
                {results.length === 0 ? (
                  <Card className="p-12 text-center">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-300">
                      <Skull size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Scan Data Available</h3>
                    <p className="text-stone-500 max-w-md mx-auto mb-8">
                      Run a Port Scan, Subdomain Enumeration, or Path Traversal first. 
                      Strategies will be tailored based on your findings.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getExploitStrategies().map((strat) => (
                      <Card key={strat.id} className="p-6 border-l-4 border-l-stone-900">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg">{strat.name}</h3>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              strat.relevance.includes('High') ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-500'
                            }`}>
                              Relevance: {strat.relevance}
                            </span>
                          </div>
                          <div className="text-stone-300">
                            <Skull size={20} />
                          </div>
                        </div>
                        <p className="text-sm text-stone-600 mb-4">{strat.description}</p>
                        
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Methodology</p>
                            <p className="text-xs text-stone-500 leading-relaxed">{strat.methodology}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Attack Steps</p>
                            <ul className="space-y-1">
                              {strat.steps.map((step, idx) => (
                                <li key={idx} className="text-xs text-stone-600 flex items-start gap-2">
                                  <span className="text-stone-400 mt-0.5">•</span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cheatsheets' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loadingSheets ? (
                  <div className="col-span-full py-20 flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-stone-400" size={32} />
                    <p className="text-stone-500">Generating cheat sheets...</p>
                  </div>
                ) : (
                  cheatSheets.map((sheet, i) => (
                    <Card key={i} className="p-6 hover:border-stone-400 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-lg group-hover:text-stone-900 transition-colors">{sheet.name}</h3>
                        <div className="w-8 h-8 bg-stone-50 rounded-lg flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-all">
                          <FileText size={16} />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Why it works</p>
                          <p className="text-sm text-stone-600 leading-relaxed">{sheet.explanation}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Context</p>
                            <p className="text-xs text-stone-500">{sheet.context}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Purpose</p>
                            <p className="text-xs text-stone-500">{sheet.purpose}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase text-stone-400 mb-1">Common Payloads</p>
                          <div className="flex flex-wrap gap-2">
                            {sheet.payloads.map((p, j) => (
                              <code key={j} className="px-2 py-1 bg-stone-100 text-stone-800 rounded text-[10px] font-mono border border-stone-200">
                                {p}
                              </code>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
