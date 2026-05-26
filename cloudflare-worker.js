export default {
  async fetch(request, env) {
    // Setup CORS headers so the static blog can access this API safely
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // API to FETCH comments: GET /api/comments?post_id=slug
    if (url.pathname === "/api/comments" && request.method === "GET") {
      const postId = url.searchParams.get("post_id");
      if (!postId) {
        return new Response(JSON.stringify({ error: "Missing post_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const commentsJson = await env.COMMENTS_KV.get(postId);
      const comments = commentsJson ? JSON.parse(commentsJson) : [];

      return new Response(JSON.stringify(comments), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // API to POST comment: POST /api/comments
    if (url.pathname === "/api/comments" && request.method === "POST") {
      try {
        const { post_id, nickname, message } = await request.json();

        if (!post_id || !nickname || !message) {
          return new Response(JSON.stringify({ error: "Missing fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Basic sanitization & limits
        const cleanNickname = nickname.trim().substring(0, 50);
        const cleanMessage = message.trim().substring(0, 1000);

        if (!cleanNickname || !cleanMessage) {
          return new Response(JSON.stringify({ error: "Invalid content" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Retrieve existing comments
        const commentsJson = await env.COMMENTS_KV.get(post_id);
        const comments = commentsJson ? JSON.parse(commentsJson) : [];

        // Build new comment object
        const newComment = {
          id: crypto.randomUUID(),
          nickname: cleanNickname,
          message: cleanMessage,
          date: new Date().toISOString()
        };

        comments.push(newComment);
        
        // Save back to KV Storage
        await env.COMMENTS_KV.put(post_id, JSON.stringify(comments));

        return new Response(JSON.stringify(newComment), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};
