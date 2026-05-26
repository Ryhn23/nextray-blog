export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ==========================================
    // 1. COMMENTS ENDPOINTS
    // ==========================================

    // API to FETCH comments: GET /api/comments?post_id=slug
    if (url.pathname === "/api/comments" && request.method === "GET") {
      const postId = url.searchParams.get("post_id");
      if (!postId) {
        return new Response(JSON.stringify({ error: "Missing post_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const commentsJson = await env.COMMENTS_KV.get(`comments:${postId}`);
      const comments = commentsJson ? JSON.parse(commentsJson) : [];

      return new Response(JSON.stringify(comments), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // API to POST comment / reply: POST /api/comments
    if (url.pathname === "/api/comments" && request.method === "POST") {
      try {
        const { post_id, nickname, message, parent_id } = await request.json();

        if (!post_id || !nickname || !message) {
          return new Response(JSON.stringify({ error: "Missing fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const cleanNickname = nickname.trim().substring(0, 50);
        const cleanMessage = message.trim().substring(0, 1000);

        if (!cleanNickname || !cleanMessage) {
          return new Response(JSON.stringify({ error: "Invalid content" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const commentsJson = await env.COMMENTS_KV.get(`comments:${post_id}`);
        const comments = commentsJson ? JSON.parse(commentsJson) : [];

        // Build new comment/reply object
        const newComment = {
          id: crypto.randomUUID(),
          parentId: parent_id || null, // null means root comment
          nickname: cleanNickname,
          message: cleanMessage,
          date: new Date().toISOString(),
          reactions: {
            "👍": 0,
            "❤️": 0,
            "🔥": 0,
            "😂": 0
          }
        };

        comments.push(newComment);
        await env.COMMENTS_KV.put(`comments:${post_id}`, JSON.stringify(comments));

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

    // API to increment reactions: POST /api/comments/react
    if (url.pathname === "/api/comments/react" && request.method === "POST") {
      try {
        const { post_id, comment_id, emoji } = await request.json();

        if (!post_id || !comment_id || !emoji) {
          return new Response(JSON.stringify({ error: "Missing fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const validEmojis = ["👍", "❤️", "🔥", "😂"];
        if (!validEmojis.includes(emoji)) {
          return new Response(JSON.stringify({ error: "Invalid emoji" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const commentsJson = await env.COMMENTS_KV.get(`comments:${post_id}`);
        if (!commentsJson) {
          return new Response(JSON.stringify({ error: "Comments not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const comments = JSON.parse(commentsJson);
        const comment = comments.find(c => c.id === comment_id);

        if (!comment) {
          return new Response(JSON.stringify({ error: "Comment not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (!comment.reactions) {
          comment.reactions = { "👍": 0, "❤️": 0, "🔥": 0, "😂": 0 };
        }

        comment.reactions[emoji] = (comment.reactions[emoji] || 0) + 1;

        await env.COMMENTS_KV.put(`comments:${post_id}`, JSON.stringify(comments));

        return new Response(JSON.stringify({ reactions: comment.reactions }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Server error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ==========================================
    // 2. POST (ARTICLE) REACTIONS ENDPOINTS
    // ==========================================

    // API to FETCH post reactions: GET /api/post/reactions?post_id=slug
    if (url.pathname === "/api/post/reactions" && request.method === "GET") {
      const postId = url.searchParams.get("post_id");
      if (!postId) {
        return new Response(JSON.stringify({ error: "Missing post_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const reactionsJson = await env.COMMENTS_KV.get(`post_reactions:${postId}`);
      const reactions = reactionsJson ? JSON.parse(reactionsJson) : { "👍": 0, "❤️": 0, "🔥": 0, "😂": 0 };

      return new Response(JSON.stringify(reactions), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // API to increment post reactions: POST /api/post/react
    if (url.pathname === "/api/post/react" && request.method === "POST") {
      try {
        const { post_id, emoji } = await request.json();

        if (!post_id || !emoji) {
          return new Response(JSON.stringify({ error: "Missing fields" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const validEmojis = ["👍", "❤️", "🔥", "😂"];
        if (!validEmojis.includes(emoji)) {
          return new Response(JSON.stringify({ error: "Invalid emoji" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const reactionsJson = await env.COMMENTS_KV.get(`post_reactions:${post_id}`);
        const reactions = reactionsJson ? JSON.parse(reactionsJson) : { "👍": 0, "❤️": 0, "🔥": 0, "😂": 0 };

        reactions[emoji] = (reactions[emoji] || 0) + 1;

        await env.COMMENTS_KV.put(`post_reactions:${post_id}`, JSON.stringify(reactions));

        return new Response(JSON.stringify(reactions), {
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
