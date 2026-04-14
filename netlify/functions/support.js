const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

function respond(code, data) {
  return { statusCode: code, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

const tickets = [];
let nextId = 1;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };

  const method = event.httpMethod;
  const fullPath = event.path || '';
  const parts = fullPath.split('/').filter(Boolean);
  let route = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'support') { route = parts.slice(i + 1); break; }
  }
  const body = event.body ? JSON.parse(event.body) : {};
  const query = event.queryStringParameters || {};

  try {
    // GET /stats
    if (route[0] === 'stats' && method === 'GET') {
      const byStatus = {};
      const byPriority = {};

      for (const t of tickets) {
        byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      }

      return respond(200, {
        total: tickets.length,
        byStatus,
        byPriority,
        note: 'In-memory storage resets on cold start'
      });
    }

    // GET /tickets — list all, filterable
    if (route[0] === 'tickets' && route.length === 1 && method === 'GET') {
      let filtered = [...tickets];

      if (query.status) {
        filtered = filtered.filter(t => t.status === query.status);
      }
      if (query.priority) {
        filtered = filtered.filter(t => t.priority === query.priority);
      }
      if (query.assignee) {
        filtered = filtered.filter(t => t.assignee === query.assignee);
      }
      if (query.category) {
        filtered = filtered.filter(t => t.category === query.category);
      }

      return respond(200, {
        tickets: filtered,
        total: filtered.length,
        note: 'In-memory storage resets on cold start'
      });
    }

    // POST /tickets — create
    if (route[0] === 'tickets' && route.length === 1 && method === 'POST') {
      const id = `SUP-${String(nextId).padStart(3, '0')}`;
      nextId++;

      const ticket = {
        id,
        title: body.title || 'Untitled',
        description: body.description || '',
        status: body.status || 'open',
        priority: body.priority || 'medium',
        category: body.category || 'general',
        assignee: body.assignee || null,
        reporter: body.reporter || 'anonymous',
        comments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      tickets.push(ticket);
      return respond(201, { ticket, note: 'In-memory storage resets on cold start' });
    }

    // GET /tickets/:id
    if (route[0] === 'tickets' && route[1] && route.length === 2 && method === 'GET') {
      const ticket = tickets.find(t => t.id === route[1]);
      if (!ticket) return respond(404, { error: `Ticket ${route[1]} not found` });
      return respond(200, ticket);
    }

    // PUT /tickets/:id
    if (route[0] === 'tickets' && route[1] && route.length === 2 && method === 'PUT') {
      const ticket = tickets.find(t => t.id === route[1]);
      if (!ticket) return respond(404, { error: `Ticket ${route[1]} not found` });

      if (body.title !== undefined) ticket.title = body.title;
      if (body.description !== undefined) ticket.description = body.description;
      if (body.status !== undefined) ticket.status = body.status;
      if (body.priority !== undefined) ticket.priority = body.priority;
      if (body.category !== undefined) ticket.category = body.category;
      if (body.assignee !== undefined) ticket.assignee = body.assignee;
      ticket.updated_at = new Date().toISOString();

      return respond(200, { ticket, note: 'In-memory storage resets on cold start' });
    }

    // POST /tickets/:id/comment
    if (route[0] === 'tickets' && route[1] && route[2] === 'comment' && method === 'POST') {
      const ticket = tickets.find(t => t.id === route[1]);
      if (!ticket) return respond(404, { error: `Ticket ${route[1]} not found` });

      const comment = {
        author: body.author || 'anonymous',
        text: body.text || body.comment || '',
        created_at: new Date().toISOString()
      };

      ticket.comments.push(comment);
      ticket.updated_at = new Date().toISOString();

      return respond(201, { comment, ticket_id: ticket.id });
    }

    return respond(404, { error: 'Route not found', route });
  } catch (err) {
    return respond(500, { error: err.message });
  }
};
