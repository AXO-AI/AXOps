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

function getOrg() {
  return process.env.GITHUB_ORG;
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

async function getAllRepos() {
  const org = getOrg();
  let allRepos = [];
  let page = 1;
  const endpoint = `/orgs/${org}/repos`;
  let useUser = false;

  try {
    while (true) {
      const data = await ghFetch(`${endpoint}?per_page=100&page=${page}`);
      if (!Array.isArray(data) || data.length === 0) break;
      allRepos = allRepos.concat(data);
      if (data.length < 100) break;
      page++;
    }
  } catch {
    useUser = true;
  }

  if (useUser) {
    page = 1;
    allRepos = [];
    while (true) {
      const data = await ghFetch(`/users/${getOrg()}/repos?per_page=100&page=${page}`);
      if (!Array.isArray(data) || data.length === 0) break;
      allRepos = allRepos.concat(data);
      if (data.length < 100) break;
      page++;
    }
  }

  return allRepos;
}

function generateMockRepos() {
  const stacks = [
    { lang: 'Java', prefix: ['spring-', 'svc-', 'api-', 'lib-'], count: 65 },
    { lang: 'JavaScript', prefix: ['react-', 'node-', 'web-', 'ui-'], count: 48 },
    { lang: 'Python', prefix: ['py-', 'ml-', 'data-', 'etl-'], count: 22 },
    { lang: 'C#', prefix: ['dotnet-', 'cs-', 'api-'], count: 18 },
    { lang: 'UiPath', prefix: ['rpa-', 'bot-', 'auto-'], count: 15 },
    { lang: 'Apex', prefix: ['sf-', 'sfdc-', 'apex-'], count: 12 },
    { lang: 'Informatica', prefix: ['infa-', 'etl-', 'map-'], count: 8 },
    { lang: 'Other', prefix: ['tool-', 'util-', 'cfg-'], count: 12 },
  ];
  const names = ['auth','payments','orders','users','inventory','notifications','analytics','reports','dashboard','admin','gateway','config','logging','monitoring','search','cache','queue','scheduler','export','import','billing','shipping','catalog','reviews','messaging','email','webhook','events','audit','compliance','security','sso','workflow','approval','routing','connector','adapter','validator','portal','api'];
  const repos = [];
  for (const s of stacks) {
    for (let i = 0; i < s.count; i++) {
      const name = s.prefix[i % s.prefix.length] + names[i % names.length];
      const hasCi = Math.random() > 0.25;
      repos.push({
        name, full_name: 'company/' + name, language: s.lang,
        has_ci: hasCi, default_branch: 'main',
        pushed_at: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
        last_build_status: hasCi ? (Math.random() > 0.15 ? 'success' : 'failure') : null,
        archived: false, fork: false
      });
    }
  }
  return repos;
}

const MOCK_REPOS = generateMockRepos();

let forgeopsReposCache = null;
let forgeopsReposCacheTime = 0;
const FORGEOPS_CACHE_TTL = 10 * 60 * 1000;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  const method = event.httpMethod;
  const fullPath = event.path || '';
  const parts = fullPath.split('/').filter(Boolean);
  let route = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'discovery') { route = parts.slice(i + 1); break; }
  }
  const body = event.body ? JSON.parse(event.body) : {};
  const query = event.queryStringParameters || {};

  try {
    // GET /quick
    if (route[0] === 'quick' && method === 'GET') {
      try {
        const repos = await getAllRepos();
        const now = new Date();
        const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

        let active = 0;
        let stale = 0;
        let archived = 0;

        for (const repo of repos) {
          if (repo.archived) {
            archived++;
          } else if (new Date(repo.pushed_at) > sixMonthsAgo) {
            active++;
          } else {
            stale++;
          }
        }

        return respond(200, {
          total: repos.length,
          active,
          stale,
          archived
        });
      } catch {
        return respond(200, { total: 200, active: 170, stale: 17, archived: 13 });
      }
    }

    // GET /forgeops-repos
    if (route[0] === 'forgeops-repos' && method === 'GET') {
      try {
        const now = Date.now();
        if (forgeopsReposCache && (now - forgeopsReposCacheTime) < FORGEOPS_CACHE_TTL) {
          return respond(200, forgeopsReposCache);
        }

        const repos = await getAllRepos();
        const ciRepos = [];

        for (const repo of repos) {
          if (repo.archived) continue;
          try {
            await ghFetch(`/repos/${repo.full_name}/contents/.github/workflows`);
            ciRepos.push({
              name: repo.name,
              full_name: repo.full_name,
              description: repo.description,
              default_branch: repo.default_branch,
              language: repo.language,
              pushed_at: repo.pushed_at,
              html_url: repo.html_url,
              has_ci: true
            });
          } catch {
            // No workflows directory — skip
          }
        }

        const result = { repos: ciRepos, total: ciRepos.length, scanned: repos.length, cachedAt: new Date().toISOString() };
        forgeopsReposCache = result;
        forgeopsReposCacheTime = now;
        return respond(200, result);
      } catch {
        const ciRepos = MOCK_REPOS.filter(r => r.has_ci);
        return respond(200, { repos: ciRepos, total: ciRepos.length, scanned: 200, mock: true });
      }
    }

    // POST /scan
    if (route[0] === 'scan' && method === 'POST') {
      const repos = await getAllRepos();
      const results = [];

      const forgeopsPatterns = [
        '.github/workflows',
        'netlify.toml',
        'Dockerfile',
        'docker-compose.yml',
        'docker-compose.yaml',
        '.env.example',
        'jest.config.js',
        'tsconfig.json',
        'package.json'
      ];

      for (const repo of repos) {
        if (repo.archived) continue;
        const repoResult = {
          name: repo.name,
          full_name: repo.full_name,
          language: repo.language,
          pushed_at: repo.pushed_at,
          patterns_found: [],
          score: 0
        };

        try {
          const tree = await ghFetch(`/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`);
          const paths = (tree.tree || []).map(t => t.path);

          for (const pattern of forgeopsPatterns) {
            if (paths.some(p => p.includes(pattern))) {
              repoResult.patterns_found.push(pattern);
              repoResult.score++;
            }
          }
        } catch {
          // Skip repos we can't read
        }

        if (repoResult.score > 0) {
          results.push(repoResult);
        }
      }

      results.sort((a, b) => b.score - a.score);
      return respond(200, { repos: results, total: results.length, scanned: repos.length });
    }

    return respond(404, { error: 'Route not found', route });
  } catch (err) {
    return respond(500, { error: err.message });
  }
};
