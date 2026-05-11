/** Fixed skill tags shown on Settings → Profile (and can be reused for filters later). */
export const PROFILE_SKILL_OPTIONS = [
  "Market Research",
  "Business Strategy",
  "UX/UI",
  "Vibe Coding",
  "Analytics",
  "Data Structures",
  "Marketing",
  "Sales",
  "Creative",
  "Project Management",
  "Photo/Video",
] as const;

export type ProfileToolCategory = {
  title: string;
  options: readonly string[];
};

/** Tools on Settings → Profile, grouped by category. */
export const PROFILE_TOOL_CATEGORIES: readonly ProfileToolCategory[] = [
  {
    title: "Code Generation & AI IDEs",
    options: [
      "Cursor",
      "GitHub Copilot",
      "Windsurf (formerly Codeium)",
      "Replit (Ghostwriter & Replit Agent)",
      "Bolt.new",
      "Lovable",
      "Claude Code",
    ],
  },
  {
    title: "Frontend & UI Generation",
    options: [
      "v0 by Vercel",
      'tldraw ("Make Real")',
      "OpenUI",
      "Figma (AI features & plugins)",
      "Locofy",
      "shadcn/ui",
    ],
  },
  {
    title: "Backend & Database",
    options: ["Supabase", "Firebase", "Prisma", "Drizzle", "Convex"],
  },
  {
    title: "Vector Databases & RAG",
    options: [
      "Pinecone",
      "Weaviate",
      "Chroma",
      "LangChain",
      "LlamaIndex",
      "Vercel AI SDK",
    ],
  },
  {
    title: "Deployment & Hosting",
    options: ["Vercel", "Netlify", "Railway", "Render", "Cloudflare Workers"],
  },
  {
    title: "AI APIs & Model Access",
    options: [
      "Anthropic API",
      "OpenAI API",
      "Google Gemini API",
      "Groq",
      "Replicate",
      "Hugging Face",
      "Together AI",
      "Fireworks AI",
    ],
  },
  {
    title: "Auth, Payments & SaaS Plumbing",
    options: ["Clerk", "Auth.js", "Stripe", "Resend", "Upstash"],
  },
  {
    title: "Design & Asset Generation",
    options: [
      "Midjourney",
      "DALL-E",
      "Flux",
      "Recraft",
      "ElevenLabs",
      "Suno",
      "Udio",
      "Canva",
    ],
  },
  {
    title: "Version Control & Collaboration",
    options: ["GitHub", "Linear", "Notion"],
  },
  {
    title: "Testing & Quality",
    options: ["Playwright", "Vitest"],
  },
] as const;
