const fetch = require('node-fetch');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

function respond(code, data) {
  return { statusCode: code, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

let releaseCountsCache = null;
let releaseCountsCacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000;

function getAuth() {
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_TOKEN;
  return 'Basic ' + Buffer.from(`${email}:${token}`).toString('base64');
}

function getBaseUrl() {
  return process.env.JIRA_URL;
}

function getProject() {
  return process.env.JIRA_PROJECT;
}

async function jiraFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': getAuth(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`Jira API ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  const method = event.httpMethod;
  const fullPath = event.path || '';
  const parts = fullPath.split('/').filter(Boolean);
  let route = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'jira') { route = parts.slice(i + 1); break; }
  }
  const body = event.body ? JSON.parse(event.body) : {};
  const query = event.queryStringParameters || {};

  try {
    // GET /myself
    if (route[0] === 'myself' && method === 'GET') {
      const data = await jiraFetch('/rest/api/2/myself');
      return respond(200, data);
    }

    // POST /search
    if (route[0] === 'search' && method === 'POST') {
      const payload = {
        jql: body.jql || '',
        maxResults: body.maxResults || 50,
        fields: body.fields || []
      };
      if (body.nextPageToken) {
        payload.nextPageToken = body.nextPageToken;
      }
      const data = await jiraFetch('/rest/api/3/search/jql', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return respond(200, data);
    }

    // GET /search-all
    if (route[0] === 'search-all' && method === 'GET') {
      const jql = query.jql || '';
      const fields = query.fields ? query.fields.split(',') : [];
      let allIssues = [];
      let nextPageToken = null;

      do {
        const payload = { jql, maxResults: 100, fields };
        if (nextPageToken) payload.nextPageToken = nextPageToken;
        const data = await jiraFetch('/rest/api/3/search/jql', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const issues = data.issues || [];
        allIssues = allIssues.concat(issues);
        nextPageToken = data.nextPageToken || null;
      } while (nextPageToken);

      return respond(200, { issues: allIssues, total: allIssues.length });
    }

    // GET /versions
    if (route[0] === 'versions' && method === 'GET') {
      const project = getProject();
      const data = await jiraFetch(`/rest/api/2/project/${project}/versions`);
      return respond(200, data);
    }

    // GET /release-counts
    if (route[0] === 'release-counts' && method === 'GET') {
      const now = Date.now();
      if (releaseCountsCache && (now - releaseCountsCacheTime) < CACHE_TTL) {
        return respond(200, releaseCountsCache);
      }

      const project = getProject();
      const jql = `project = ${project} AND status != Done ORDER BY created DESC`;
      let allIssues = [];
      let nextPageToken = null;

      do {
        const payload = {
          jql,
          maxResults: 100,
          fields: ['issuetype', 'fixVersions', 'status', 'summary', 'labels']
        };
        if (nextPageToken) payload.nextPageToken = nextPageToken;
        const data = await jiraFetch('/rest/api/3/search/jql', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        allIssues = allIssues.concat(data.issues || []);
        nextPageToken = data.nextPageToken || null;
      } while (nextPageToken);

      const grouped = {};
      for (const issue of allIssues) {
        const fields = issue.fields || {};
        const fixVersions = fields.fixVersions || [];
        const typeName = (fields.issuetype && fields.issuetype.name) || '';
        const labels = (fields.labels || []).map(l => l.toLowerCase());
        const summary = fields.summary || '';

        const isDefect = typeName === 'Bug' ||
          labels.includes('defect') ||
          labels.includes('bug') ||
          summary.startsWith('[Defect]');

        const versionNames = fixVersions.length > 0
          ? fixVersions.map(v => v.name)
          : ['Unscheduled'];

        for (const vName of versionNames) {
          if (!grouped[vName]) grouped[vName] = { stories: 0, defects: 0, total: 0 };
          if (isDefect) {
            grouped[vName].defects++;
          } else {
            grouped[vName].stories++;
          }
          grouped[vName].total++;
        }
      }

      const result = { releases: grouped, totalIssues: allIssues.length, cachedAt: new Date().toISOString() };
      releaseCountsCache = result;
      releaseCountsCacheTime = now;
      return respond(200, result);
    }

    // GET /tickets
    if (route[0] === 'tickets' && method === 'GET') {
      const project = getProject();
      const jqlParts = [`project = ${project}`];

      if (query.release) {
        jqlParts.push(`fixVersion = "${query.release}"`);
      }
      if (query.type) {
        if (query.type === 'Bug') {
          jqlParts.push(`(issuetype = Bug OR labels in (defect, bug))`);
        } else if (query.type === 'Story') {
          jqlParts.push(`issuetype = Story`);
        } else {
          jqlParts.push(`issuetype = "${query.type}"`);
        }
      }
      if (query.status) {
        jqlParts.push(`status = "${query.status}"`);
      }

      const jql = jqlParts.join(' AND ') + ' ORDER BY created DESC';
      const maxResults = parseInt(query.maxResults) || 50;

      const data = await jiraFetch('/rest/api/3/search/jql', {
        method: 'POST',
        body: JSON.stringify({ jql, maxResults, fields: ['summary', 'status', 'issuetype', 'assignee', 'priority', 'fixVersions', 'labels', 'created', 'updated'] })
      });
      return respond(200, data);
    }

    // POST /issue — create
    if (route[0] === 'issue' && route.length === 1 && method === 'POST') {
      const data = await jiraFetch('/rest/api/2/issue', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return respond(201, data);
    }

    // GET /issue/:key
    if (route[0] === 'issue' && route[1] && route.length === 2 && method === 'GET') {
      const data = await jiraFetch(`/rest/api/2/issue/${route[1]}`);
      return respond(200, data);
    }

    // PUT /issue/:key
    if (route[0] === 'issue' && route[1] && route.length === 2 && method === 'PUT') {
      const data = await jiraFetch(`/rest/api/2/issue/${route[1]}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
      return respond(200, data || { success: true });
    }

    // GET /issue/:key/transitions
    if (route[0] === 'issue' && route[1] && route[2] === 'transitions' && method === 'GET') {
      const data = await jiraFetch(`/rest/api/2/issue/${route[1]}/transitions`);
      return respond(200, data);
    }

    // POST /issue/:key/transition
    if (route[0] === 'issue' && route[1] && route[2] === 'transition' && method === 'POST') {
      const data = await jiraFetch(`/rest/api/2/issue/${route[1]}/transitions`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return respond(200, data || { success: true });
    }

    // GET /issue/:key/comment
    if (route[0] === 'issue' && route[1] && route[2] === 'comment' && method === 'GET') {
      const data = await jiraFetch(`/rest/api/2/issue/${route[1]}/comment`);
      return respond(200, data);
    }

    // POST /issue/:key/comment
    if (route[0] === 'issue' && route[1] && route[2] === 'comment' && method === 'POST') {
      const data = await jiraFetch(`/rest/api/2/issue/${route[1]}/comment`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      return respond(201, data);
    }

    return respond(404, { error: 'Route not found', route });
  } catch (err) {
    return respond(500, { error: err.message });
  }
};
