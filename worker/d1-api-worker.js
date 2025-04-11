/**
 * d1-api-worker.js
 * 
 * Cloudflare Worker that provides a REST API for D1 database operations.
 * This Worker acts as a bridge between the CloudflareD1Manager in the app
 * and the actual D1 database.
 */

// Define allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://your-app-domain.com',
  'capacitor://localhost',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:19000', // Expo development server
  'http://localhost:19006'  // Expo web
];

// Define API key for authentication
// In production, use a more secure authentication method
const API_KEY = 'YOUR_SECURE_API_KEY';

// Helper function to handle CORS
function handleCors(request) {
  const origin = request.headers.get('Origin');
  
  // Check if the origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    return corsHeaders;
  }
  
  return {};
}

// Helper function to validate API key
function validateApiKey(request) {
  const apiKey = request.headers.get('X-API-Key');
  return apiKey === API_KEY;
}

// Helper function to parse request body
async function parseRequestBody(request) {
  const contentType = request.headers.get('Content-Type') || '';
  
  if (contentType.includes('application/json')) {
    return await request.json();
  }
  
  return null;
}

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    const corsHeaders = handleCors(request);
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    // Parse URL and path
    const url = new URL(request.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // Only proceed if the path starts with 'api'
    if (path[0] !== 'api') {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
    
    // Validate API key
    if (!validateApiKey(request)) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
    
    try {
      // Handle different API endpoints
      if (path[1] === 'd1') {
        // Get the D1 database binding
        const db = env.DB; // Make sure this matches your D1 binding name in wrangler.toml
        
        if (!db) {
          throw new Error('D1 database binding not found');
        }
        
        if (path[2] === 'query') {
          // Execute a query with parameters
          if (request.method === 'POST') {
            const body = await parseRequestBody(request);
            
            if (!body || !body.sql) {
              return new Response('Bad Request: Missing SQL query', { 
                status: 400, 
                headers: corsHeaders 
              });
            }
            
            const stmt = db.prepare(body.sql);
            
            // Bind parameters if provided
            if (body.params && Array.isArray(body.params) && body.params.length > 0) {
              stmt.bind(...body.params);
            }
            
            const result = await stmt.run();
            
            return new Response(JSON.stringify({ result }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }
        } 
        else if (path[2] === 'query/batch') {
          // Execute a batch of queries
          if (request.method === 'POST') {
            const body = await parseRequestBody(request);
            
            if (!body || !body.batch || !Array.isArray(body.batch)) {
              return new Response('Bad Request: Missing batch queries', { 
                status: 400, 
                headers: corsHeaders 
              });
            }
            
            // Prepare all statements
            const statements = body.batch.map(item => {
              const stmt = db.prepare(item.sql);
              if (item.params && Array.isArray(item.params) && item.params.length > 0) {
                return stmt.bind(...item.params);
              }
              return stmt;
            });
            
            // Execute batch
            const result = await db.batch(statements);
            
            return new Response(JSON.stringify({ result }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }
        } 
        else if (path[2] === 'query/raw') {
          // Execute a raw SQL query
          if (request.method === 'POST') {
            const body = await parseRequestBody(request);
            
            if (!body || !body.sql) {
              return new Response('Bad Request: Missing SQL query', { 
                status: 400, 
                headers: corsHeaders 
              });
            }
            
            const result = await db.exec(body.sql);
            
            return new Response(JSON.stringify({ result }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
              }
            });
          }
        }
      }
      
      // If we reach here, the endpoint wasn't found
      return new Response('Not Found', { status: 404, headers: corsHeaders });
      
    } catch (error) {
      // Handle errors
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: error.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
