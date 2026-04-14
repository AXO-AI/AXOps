const fetch = require('node-fetch');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

function respond(code, data) {
  return { statusCode: code, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

async function callClaude(systemPrompt, userContent, maxTokens = 4096) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }]
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${JSON.stringify(data)}`);

  // Extract text from Anthropic response format
  const text = data.content?.[0]?.text || '';
  return { response: text, raw: data };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  const method = event.httpMethod;
  const fullPath = event.path || '';
  const parts = fullPath.split('/').filter(Boolean);
  let route = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'ai') { route = parts.slice(i + 1); break; }
  }
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    if (method !== 'POST') {
      return respond(405, { error: 'All AI routes require POST' });
    }

    // POST /analyze-transcript
    if (route[0] === 'analyze-transcript') {
      const systemPrompt = `You are a project management assistant for AXOps. Analyze meeting transcripts and extract actionable items. Return a JSON object with:
- stories: array of {title, description, acceptance_criteria, priority}
- defects: array of {title, description, steps_to_reproduce, severity}
- action_items: array of {description, assignee, due_date}
Return ONLY valid JSON, no markdown.`;
      const data = await callClaude(systemPrompt, body.transcript || body.text);
      return respond(200, data);
    }

    // POST /code-review
    if (route[0] === 'code-review') {
      const systemPrompt = `You are a senior code reviewer for AXOps. Review the provided code diff and identify:
- Bugs and logical errors
- Security vulnerabilities
- Performance issues
- Code style and best practices
Format your response as JSON with: {summary, issues: [{severity, category, line, description, suggestion}], overall_rating}
Return ONLY valid JSON, no markdown.`;
      const data = await callClaude(systemPrompt, body.diff || body.code);
      return respond(200, data);
    }

    // POST /root-cause
    if (route[0] === 'root-cause') {
      const systemPrompt = `You are a DevOps expert for AXOps. Analyze the provided error logs and perform root cause analysis. Return JSON with:
- root_cause: string describing the likely root cause
- contributing_factors: array of strings
- impact: string describing the impact
- remediation_steps: array of {step, description, priority}
- prevention: array of recommendations to prevent recurrence
Return ONLY valid JSON, no markdown.`;
      const data = await callClaude(systemPrompt, body.logs || body.error);
      return respond(200, data);
    }

    // POST /changelog
    if (route[0] === 'changelog') {
      const systemPrompt = `You are a technical writer for AXOps. Generate release notes from the provided commit history. Return JSON with:
- version: string
- date: string
- highlights: array of key changes
- sections: {features: [], fixes: [], improvements: [], breaking_changes: []}
Each item should have: {description, commit_sha (abbreviated)}
Return ONLY valid JSON, no markdown.`;
      const userContent = typeof body.commits === 'string' ? body.commits : JSON.stringify(body.commits);
      const data = await callClaude(systemPrompt, userContent);
      return respond(200, data);
    }

    // POST /chat
    if (route[0] === 'chat') {
      const page = body.context?.page || '';
      const systemPrompt = `You are the AXOps AI Assistant — an intelligent DevSecOps co-pilot embedded in the AXOps platform.

AXOps is an enterprise DevSecOps command center with these modules:
- Overview: dashboard with repo stats, pipeline health, policy compliance
- Commit: browse Jira tickets by release, create branches, edit files, commit & push
- Merge: compare branches, cherry-pick commits, SCA scan, approval workflow, real GitHub merges
- CI/CD: build history, deploy between environments, compare environments, approvals, audit trail
- Pipelines: visual pipeline builder — drag stages to build GitHub Actions YAML, edit existing workflows, 8 templates (Node.js, Java, Python, .NET, Salesforce, UiPath, Informatica, Docker)
- Security: SCA vulnerability scanning
- Policies: 7-category policy engine (pipeline, branch, secrets, deployment, compliance, AI policies)
- Meetings: AI transcript analysis
- Support: internal ticket management

The user is currently on: ${page || 'unknown page'}

When the user asks you to DO something (create a pipeline, scan a repo, etc.):
1. Give specific step-by-step instructions using the AXOps UI
2. Reference the exact page and buttons to click
3. If it involves the Pipelines page, describe which template to use and which stages to add
4. Be actionable — don't just explain concepts, tell them exactly what to do

When the user asks a question, be concise and practical. Use short paragraphs, not walls of text.`;

      const data = await callClaude(systemPrompt, body.message || body.question, body.maxTokens || 2048);
      return respond(200, data);
    }

    // POST /pr-description
    if (route[0] === 'pr-description') {
      const systemPrompt = `You are a developer assistant for AXOps. Generate a clear PR description from the provided diff. Return JSON with:
- title: concise PR title (under 72 chars)
- summary: 2-3 sentence overview
- changes: array of {category, items: [string]}
- testing_notes: array of testing suggestions
Return ONLY valid JSON, no markdown.`;
      const data = await callClaude(systemPrompt, body.diff || body.changes);
      return respond(200, data);
    }

    return respond(404, { error: 'Route not found', route });
  } catch (err) {
    return respond(500, { error: err.message });
  }
};
