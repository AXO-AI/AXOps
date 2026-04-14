const fetch = require('node-fetch');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

function respond(code, data) {
  return { statusCode: code, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

function getToken() {
  return process.env.GITHUB_TOKEN;
}

async function ghFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `https://api.github.com${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

const DEPENDENCY_FILES = [
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'requirements.txt',
  'Pipfile.lock',
  'Gemfile.lock',
  'go.sum',
  'pom.xml',
  'build.gradle',
  'Cargo.lock'
];

const VULNERABILITY_PATTERNS = [
  { pattern: /eval\s*\(/, severity: 'high', category: 'code-injection', description: 'Use of eval() detected' },
  { pattern: /exec\s*\(/, severity: 'medium', category: 'command-injection', description: 'Use of exec() detected' },
  { pattern: /innerHTML\s*=/, severity: 'medium', category: 'xss', description: 'Direct innerHTML assignment detected' },
  { pattern: /document\.write\s*\(/, severity: 'medium', category: 'xss', description: 'document.write() usage detected' },
  { pattern: /password\s*[:=]\s*['"][^'"]+['"]/, severity: 'critical', category: 'hardcoded-secret', description: 'Hardcoded password detected' },
  { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/, severity: 'critical', category: 'hardcoded-secret', description: 'Hardcoded API key detected' },
  { pattern: /TODO.*security/i, severity: 'low', category: 'security-todo', description: 'Security-related TODO found' },
  { pattern: /http:\/\//, severity: 'low', category: 'insecure-protocol', description: 'HTTP (non-HTTPS) URL detected' }
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  const method = event.httpMethod;
  const fullPath = event.path || '';
  const parts = fullPath.split('/').filter(Boolean);
  let route = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'sca') { route = parts.slice(i + 1); break; }
  }
  const body = event.body ? JSON.parse(event.body) : {};
  const query = event.queryStringParameters || {};

  try {
    // GET /config
    if (route[0] === 'config' && method === 'GET') {
      return respond(200, {
        scanner: 'ForgeOps SCA',
        version: '1.0.0',
        dependency_files_tracked: DEPENDENCY_FILES,
        vulnerability_patterns: VULNERABILITY_PATTERNS.length,
        severity_levels: ['critical', 'high', 'medium', 'low'],
        status: getToken() ? 'configured' : 'missing_token'
      });
    }

    // POST /scan
    if (route[0] === 'scan' && method === 'POST') {
      const { owner, repo, base, head } = body;
      if (!owner || !repo) {
        return respond(400, { error: 'owner and repo are required' });
      }

      const baseBranch = base || 'main';
      const headBranch = head || 'develop';

      // Get changed files between branches
      const comparison = await ghFetch(`/repos/${owner}/${repo}/compare/${baseBranch}...${headBranch}`);
      const changedFiles = comparison.files || [];

      const findings = [];
      let dependencyFilesChanged = [];

      for (const file of changedFiles) {
        const filename = file.filename || '';

        // Check if it's a dependency file
        const basename = filename.split('/').pop();
        if (DEPENDENCY_FILES.includes(basename)) {
          dependencyFilesChanged.push({
            file: filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions
          });

          findings.push({
            file: filename,
            severity: 'medium',
            category: 'dependency-change',
            description: `Dependency file ${basename} was ${file.status}. Review changes for known vulnerabilities.`,
            line: null
          });
        }

        // Check patch content for vulnerability patterns
        const patch = file.patch || '';
        if (patch) {
          const addedLines = patch.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++'));
          for (let i = 0; i < addedLines.length; i++) {
            const line = addedLines[i];
            for (const vuln of VULNERABILITY_PATTERNS) {
              if (vuln.pattern.test(line)) {
                findings.push({
                  file: filename,
                  severity: vuln.severity,
                  category: vuln.category,
                  description: vuln.description,
                  line: line.substring(1).trim()
                });
              }
            }
          }
        }
      }

      // Sort by severity
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      findings.sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));

      const summary = {
        critical: findings.filter(f => f.severity === 'critical').length,
        high: findings.filter(f => f.severity === 'high').length,
        medium: findings.filter(f => f.severity === 'medium').length,
        low: findings.filter(f => f.severity === 'low').length
      };

      return respond(200, {
        repo: `${owner}/${repo}`,
        base: baseBranch,
        head: headBranch,
        files_analyzed: changedFiles.length,
        dependency_files_changed: dependencyFilesChanged,
        findings,
        summary,
        total_findings: findings.length,
        scanned_at: new Date().toISOString()
      });
    }

    return respond(404, { error: 'Route not found', route });
  } catch (err) {
    return respond(500, { error: err.message });
  }
};
