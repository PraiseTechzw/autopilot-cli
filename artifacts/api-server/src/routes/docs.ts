import { Router } from "express";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
// Content lives at artifacts/autopilot-docs/content/docs/
const possiblePaths = [
  path.resolve(process.cwd(), "..", "autopilot-docs", "content", "docs"),
  path.resolve(process.cwd(), "artifacts", "autopilot-docs", "content", "docs"),
  path.resolve(__dirname, "..", "..", "..", "autopilot-docs", "content", "docs"),
];

function getDocsPath(): string {
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return possiblePaths[0];
}

const router = Router();

router.get("/docs", (_req, res) => {
  try {
    const DOCS_PATH = getDocsPath();
    if (!fs.existsSync(DOCS_PATH)) {
      res.json([]);
      return;
    }
    const files = fs.readdirSync(DOCS_PATH).filter((f) => /\.mdx?$/.test(f));
    const docs = files
      .map((file) => {
        const slug = file.replace(/\.mdx?$/, "");
        const fullPath = path.join(DOCS_PATH, file);
        const raw = fs.readFileSync(fullPath, "utf8");
        const { data } = matter(raw);
        return {
          title: data.title || slug,
          description: data.description || "",
          slug,
          route: slug === "index" ? "/docs" : `/docs/${slug}`,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to load docs" });
  }
});

const handleDocBySlug = (req: any, res: any) => {
  try {
    const rawSlug = req.params.slug;
    const slugStr = Array.isArray(rawSlug) ? rawSlug.join("/") : (rawSlug || "index");
    const slug = slugStr.replace(/\/$/, "") || "index";
    // Sanitize: strip leading slashes/dots and reject traversal sequences
    const safeName = slug.replace(/^[./]+/, "").replace(/\.\./g, "");
    if (!safeName || safeName.includes("..")) {
      res.status(400).json({ error: "Invalid slug" });
      return;
    }

    const DOCS_PATH = getDocsPath();
    const candidates = [
      path.join(DOCS_PATH, `${safeName}.mdx`),
      path.join(DOCS_PATH, `${safeName}.md`),
      path.join(DOCS_PATH, `${safeName}/index.mdx`),
      path.join(DOCS_PATH, "index.mdx"),
    ];

    let filePath: string | null = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) { filePath = c; break; }
    }

    if (!filePath) {
      res.status(404).json({ error: "Doc not found" });
      return;
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const realSlug = path.basename(filePath).replace(/\.mdx?$/, "");

    res.json({
      content,
      metadata: {
        title: data.title || realSlug,
        description: data.description || "",
        slug: realSlug,
        route: realSlug === "index" ? "/docs" : `/docs/${realSlug}`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load doc" });
  }
};

router.get("/docs/:slug(*)", handleDocBySlug);
router.get("/docs/:slug", handleDocBySlug);

export default router;
