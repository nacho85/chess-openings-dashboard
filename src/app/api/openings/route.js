import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

function toSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function jsExportArray(varName, arr) {
  return `export const ${varName} = ${JSON.stringify(arr, null, 2)};\n`;
}

function parseOpeningsIndex(indexText) {
  // import { carokann } from "./carokann-black";
  const items = [];
  const importRe =
    /import\s+\{\s*([A-Za-z0-9_$]+)\s*\}\s+from\s+["'](\.\/[^"']+)["']\s*;?/g;

  let m;
  while ((m = importRe.exec(indexText))) {
    items.push({ moduleName: m[1], relNoExt: m[2] });
  }
  return items;
}

async function importFresh(absPath) {
  const url = pathToFileURL(absPath);
  // cache bust
  url.search = `t=${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return import(url.href);
}

export async function POST(req) {
  const body = await req.json();
  const { moduleName, fileName, opening } = body || {};

  if (!opening?.id || !opening?.name || !opening?.root) {
    return Response.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const safeModule = toSlug(moduleName || opening.id || "opening").replace(/-/g, "_");
  const safeFile = `${toSlug(fileName || opening.id)}.js`;

  const libDir = path.join(process.cwd(), "src", "lib");
  const openingsIndexPath = path.join(libDir, "openings.js");
  const newFilePath = path.join(libDir, safeFile);

  const fileContent = jsExportArray(safeModule, [opening]);
  fs.writeFileSync(newFilePath, fileContent, "utf8");

  const index = fs.readFileSync(openingsIndexPath, "utf8");
  const importLine = `import { ${safeModule} } from "./${safeFile.replace(/\.js$/, "")}";`;

  let nextIndex = index;

  if (!nextIndex.includes(importLine)) {
    nextIndex = `${importLine}\n${nextIndex}`;
  }

  if (!nextIndex.includes(`...${safeModule}`)) {
    nextIndex = nextIndex.replace(
      /export const openings\s*=\s*\[\s*([\s\S]*?)\s*\];/m,
      (m, inner) => {
        const trimmed = inner.trim();
        const comma = trimmed.length ? (trimmed.endsWith(",") ? "" : ",") : "";
        return `export const openings = [\n${trimmed}${comma}\n  ...${safeModule}\n];`;
      }
    );
  }

  fs.writeFileSync(openingsIndexPath, nextIndex, "utf8");

  return Response.json({ ok: true, file: safeFile, module: safeModule });
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { opening, previousId } = body || {};

    if (!opening?.id || !opening?.name || !opening?.root) {
      return Response.json(
        { ok: false, error: "Invalid payload (opening)" },
        { status: 400 }
      );
    }

    const targetId = previousId || opening.id;

    const libDir = path.join(process.cwd(), "src", "lib");
    const openingsIndexPath = path.join(libDir, "openings.js");

    if (!fs.existsSync(openingsIndexPath)) {
      return Response.json(
        { ok: false, error: "openings.js not found in src/lib" },
        { status: 500 }
      );
    }

    // 1) Parse openings.js imports: import { carokann } from "./carokann-black";
    const indexText = fs.readFileSync(openingsIndexPath, "utf8");
    const imports = parseOpeningsIndex(indexText); // <- usá la helper que ya tenés

    // 2) Find which module file contains opening.id, by reading file and parsing exported array
    for (const { moduleName, relNoExt } of imports) {
      const absFile = path.join(libDir, `${relNoExt.replace(/^\.\//, "")}.js`);
      if (!fs.existsSync(absFile)) continue;

      const fileText = fs.readFileSync(absFile, "utf8");

      // Match: export const carokann = [ ... ];
      // Captures the JSON array inside.
      const re = new RegExp(
        `export\\s+const\\s+${moduleName}\\s*=\\s*([\\s\\S]*?);\\s*$`,
        "m"
      );

      const m = fileText.match(re);
      if (!m) continue;

      let arr;
      try {
        // Because these files are generated via JSON.stringify, this is valid JSON.
        arr = JSON.parse(m[1]);
      } catch (e) {
        return Response.json(
          { ok: false, error: `Failed to parse module ${moduleName} as JSON: ${e.message}` },
          { status: 500 }
        );
      }

      if (!Array.isArray(arr)) continue;

      const idx = arr.findIndex((o) => o?.id === targetId);
      if (idx === -1) continue;

      const nextArr = arr.slice();
      nextArr[idx] = opening;

      // 3) Rewrite file preserving "export const <moduleName> = ..."
      const nextText = `export const ${moduleName} = ${JSON.stringify(
        nextArr,
        null,
        2
      )};\n`;

      fs.writeFileSync(absFile, nextText, "utf8");

      return Response.json({
        ok: true,
        updatedId: opening.id,
        previousId: targetId,
        module: moduleName,
        file: path.basename(absFile),
      });
    }

    return Response.json(
      { ok: false, error: `Opening id '${targetId}' not found` },
      { status: 404 }
    );
  } catch (err) {
    return Response.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}