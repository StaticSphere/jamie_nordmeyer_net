#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const verbose = args.has("--verbose");

const sourceUploadsDir = path.join(repoRoot, "public", "wp-content", "uploads");
const targetUploadsDir = path.join(repoRoot, "src", "assets", "images");
const contentDir = path.join(repoRoot, "src", "content");

const summary = {
  movedFiles: 0,
  overwrittenFiles: 0,
  removedDuplicateSourceFiles: 0,
  rewrittenContentFiles: 0,
  updatedReferences: 0
};

function log(message) {
  if (verbose) {
    console.log(message);
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listFilesRecursive(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function removeEmptyDirsUpward(startDir, stopDir) {
  let current = startDir;

  while (current.startsWith(stopDir) && current !== stopDir) {
    const entries = await fs.readdir(current);

    if (entries.length > 0) {
      return;
    }

    if (!dryRun) {
      await fs.rmdir(current);
    }

    current = path.dirname(current);
  }
}

async function areFilesEqual(fileA, fileB) {
  const [bufA, bufB] = await Promise.all([fs.readFile(fileA), fs.readFile(fileB)]);
  return bufA.equals(bufB);
}

async function moveUploads() {
  const hasSource = await pathExists(sourceUploadsDir);

  if (!hasSource) {
    console.log("No source uploads directory found. Skipping file move step.");
    return;
  }

  if (!dryRun) {
    await fs.mkdir(targetUploadsDir, { recursive: true });
  }

  const sourceFiles = await listFilesRecursive(sourceUploadsDir);

  for (const sourceFile of sourceFiles) {
    const relative = path.relative(sourceUploadsDir, sourceFile);
    const targetFile = path.join(targetUploadsDir, relative);
    const targetDir = path.dirname(targetFile);

    if (!dryRun) {
      await fs.mkdir(targetDir, { recursive: true });
    }

    const targetExists = await pathExists(targetFile);

    if (!targetExists) {
      log(`move ${relative}`);
      if (!dryRun) {
        await fs.rename(sourceFile, targetFile);
      }
      summary.movedFiles += 1;
      continue;
    }

    const equal = await areFilesEqual(sourceFile, targetFile);

    if (equal) {
      log(`remove duplicate source ${relative}`);
      if (!dryRun) {
        await fs.unlink(sourceFile);
      }
      summary.removedDuplicateSourceFiles += 1;
      continue;
    }

    log(`overwrite ${relative}`);
    if (!dryRun) {
      await fs.copyFile(sourceFile, targetFile);
      await fs.unlink(sourceFile);
    }
    summary.overwrittenFiles += 1;
  }

  if (!dryRun) {
    await removeEmptyDirsUpward(sourceUploadsDir, path.join(repoRoot, "public"));
  }
}

async function rewriteContentPaths() {
  if (!(await pathExists(contentDir))) {
    return;
  }

  const contentFiles = (await listFilesRecursive(contentDir)).filter((filePath) =>
    filePath.endsWith(".md")
  );

  for (const filePath of contentFiles) {
    const original = await fs.readFile(filePath, "utf8");

    const relativeToUploads = path
      .relative(path.dirname(filePath), targetUploadsDir)
      .split(path.sep)
      .join("/");

    const replacementPrefix = `${relativeToUploads}/`;

    const rewriteAbsoluteWpUploads = (input) =>
      input
        .replace(/(^|[\s("'])\/wp-content\/uploads\//g, `$1${replacementPrefix}`)
        .replace(/(^|[\s("'])\/wp_content\/uploads\//g, `$1${replacementPrefix}`)
        .replace(/\/assets\/wp-content\/uploads\//g, "/assets/images/");

    const updated = rewriteAbsoluteWpUploads(original);

    if (updated === original) {
      continue;
    }

    const replacements =
      (original.match(/(^|[\s("'])\/wp-content\/uploads\//g)?.length ?? 0) +
      (original.match(/(^|[\s("'])\/wp_content\/uploads\//g)?.length ?? 0) +
      (original.match(/\/assets\/wp-content\/uploads\//g)?.length ?? 0);

    log(`rewrite ${path.relative(repoRoot, filePath)} (${replacements} refs)`);

    if (!dryRun) {
      await fs.writeFile(filePath, updated, "utf8");
    }

    summary.rewrittenContentFiles += 1;
    summary.updatedReferences += replacements;
  }
}

async function main() {
  await moveUploads();
  await rewriteContentPaths();

  console.log("Migration complete.");
  console.log(`- moved files: ${summary.movedFiles}`);
  console.log(`- overwritten files: ${summary.overwrittenFiles}`);
  console.log(`- removed duplicate source files: ${summary.removedDuplicateSourceFiles}`);
  console.log(`- rewritten content files: ${summary.rewrittenContentFiles}`);
  console.log(`- updated references: ${summary.updatedReferences}`);

  if (dryRun) {
    console.log("Dry run mode: no files were modified.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

