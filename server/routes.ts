import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/ai/summary", async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "title and content required" });
      }
      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are a campus notice summarizer. Given a notice, extract exactly three fields in JSON:
- "what": one sentence describing what this notice is about (max 25 words)
- "who": who should care / who is eligible (max 20 words)
- "deadline": the deadline or key date if any, otherwise "No deadline mentioned"
Return ONLY valid JSON with these three keys.`,
          },
          {
            role: "user",
            content: `Title: ${title}\n\nContent: ${content}`,
          },
        ],
        max_completion_tokens: 200,
        response_format: { type: "json_object" },
      });
      const raw = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      res.json({
        what: parsed.what || "No summary available",
        who: parsed.who || "All students",
        deadline: parsed.deadline || "No deadline mentioned",
      });
    } catch (err) {
      console.error("AI summary error:", err);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  app.post("/api/ai/search", async (req, res) => {
    try {
      const { query, posts } = req.body;
      if (!query || !posts) {
        return res.status(400).json({ error: "query and posts required" });
      }
      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: `You are a campus search assistant. Given a list of campus posts and a natural language query, return the IDs of the most relevant posts (up to 5). Return a JSON object with a single key "ids" containing an array of post ID strings. Only include IDs that actually exist in the posts list.`,
          },
          {
            role: "user",
            content: `Posts: ${JSON.stringify(posts)}\n\nQuery: "${query}"`,
          },
        ],
        max_completion_tokens: 200,
        response_format: { type: "json_object" },
      });
      const raw = response.choices[0]?.message?.content || '{"ids":[]}';
      const parsed = JSON.parse(raw);
      res.json({ ids: parsed.ids || [] });
    } catch (err) {
      console.error("AI search error:", err);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
