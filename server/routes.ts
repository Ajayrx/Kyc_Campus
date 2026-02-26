import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function ruleBasedSummary(title: string, content: string) {
  const text = `${title} ${content}`.toLowerCase();
  const deadlineMatches = content.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{0,4}|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^\.]*\d{4})\b/i);
  const deadline = deadlineMatches ? deadlineMatches[0] : "No deadline mentioned";
  let who = "All students";
  if (text.includes("final year") || text.includes("4th year")) who = "Final year students";
  else if (text.includes("3rd year") || text.includes("third year")) who = "3rd year students";
  else if (text.includes("2nd year") || text.includes("second year")) who = "2nd year students";
  else if (text.includes("1st year") || text.includes("first year")) who = "1st year students";
  else if (text.includes("faculty") || text.includes("staff")) who = "Faculty and staff members";
  else if (text.includes("placement") || text.includes("internship") || text.includes("job")) who = "Students eligible for placements";
  else if (text.includes("club") || text.includes("team")) who = "Interested students";
  const what = content.length > 80 ? content.substring(0, 80).trim() + "..." : content;
  return { what, who, deadline };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/ai/summary", async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "title and content required" });
      }
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
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
          max_tokens: 200,
          response_format: { type: "json_object" },
        });
        const raw = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(raw);
        res.json({
          what: parsed.what || ruleBasedSummary(title, content).what,
          who: parsed.who || "All students",
          deadline: parsed.deadline || "No deadline mentioned",
        });
      } catch (aiErr) {
        console.warn("AI unavailable, using rule-based summary:", aiErr);
        res.json(ruleBasedSummary(title, content));
      }
    } catch (err) {
      console.error("AI summary error:", err);
      res.json(ruleBasedSummary(req.body?.title || "", req.body?.content || ""));
    }
  });

  app.post("/api/ai/search", async (req, res) => {
    try {
      const { query, posts } = req.body;
      if (!query || !posts) {
        return res.status(400).json({ error: "query and posts required" });
      }
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
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
        max_tokens: 200,
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
