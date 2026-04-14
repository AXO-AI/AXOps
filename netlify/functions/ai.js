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
  return data;
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
  const query = event.queryStringParameters || {};

  try {
    if (method !== 'POST') {
      return respond(405, { error: 'All AI routes require POST' });
    }

    // POST /analyze-transcript
    if (route[0] === 'analyze-transcript') {
      const systemPrompt = `You are a project management assistant for ForgeOps. Analyze meeting transcripts and extract actionable items. Return a JSON object with:
- stories: array of {title, description, acceptance_criteria, priority}
- defects: array of {title, description, steps_to_reproduce, severity}
- action_items: array of {description, assignee, due_date}
Return ONLY valid JSON, no markdown.`;
      const data = await callClaude(systemPrompt, body.transcript || body.text);
      return respond(200, data);
    }

    // POST /code-review
    if (route[0] === 'code-review') {
      const systemPrompt = `You are a senior code reviewer for ForgeOps. Review the provided code diff and identify:
- Bugs and logical errors
- Security vulnerabilities
- Performance issues
- Code style and best practices
- Suggestions for improvement
Format your response as JSON with: {summary, issues: [{severity, category, line, description, suggestion}], overall_rating}
Return ONLY valid JSON, no markdown.`;
      const data = await callClaude(systemPrompt, body.diff || body.code);
      return respond(200, data);
    }

    // POST /root-cause
    if (route[0] === 'root-cause') {
      const systemPrompt = `You are a DevOps expert for ForgeOps. Analyze the provided error logs and perform root cause analysis. Return JSON with:
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
      const systemPrompt = `You are a technical writer for ForgeOps. Generate release notes from the provided commit history. Return JSON with:
- version: string
- date: string
- highlights: array of key changes
- sections: {features: [], fixes: [], improvements: [], breaking_changes: []}
- contributors: array of unique authors
Each item should have: {description, commit_sha (abbreviated)}
Return ONLY valid JSON, no markdown.`;
      const userContent = typeof body.commits === 'string' ? body.commits : JSON.stringify(body.commits);
      const data = await callClaude(systemPrompt, userContent);
      return respond(200, data);
    }

    // POST /chat
    if (route[0] === 'chat') {
      const systemPrompt = `You are ForgeOps AI Assistant, a helpful DevOps and software engineering assistant. You help with:
- CI/CD pipeline questions
- Git workflow guidance
- Jira ticket management
- Code review assistance
- Infrastructure and deployment questions
- General software engineering best practices
Be concise, practical, and specific. When relevant, reference ForgeOps platform capabilities.`;
      const data = await callClaude(systemPrompt, body.message || body.question, body.maxTokens || 4096);
      return respond(200, data);
    }

    // POST /pr-description
    if (route[0] === 'pr-description') {
      const systemPrompt = `You are a developer assistant for ForgeOps. Generate a clear, well-structured pull request description from the provided diff. Return JSON with:
- title: concise PR title (under 72 chars)
- summary: 2-3 sentence overview
- changes: array of {category, items: [string]}
- testing_notes: array of testing suggestions
- reviewers_notes: key areas for reviewers to focus on
Return ONLY valid JSON, no markdown.`;
      const data = await callClaude(systemPrompt, body.diff || body.changes);
      return respond(200, data);
    }

    return respond(404, { error: 'Route not found', route });
  } catch (err) {
    return respond(500, { error: err.message });
  }
};
