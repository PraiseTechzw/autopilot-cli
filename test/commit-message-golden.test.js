const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { generateCommitMessage } = require('../src/core/commit');

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'diffs');
const EXPECTED_FILE = path.join(__dirname, 'fixtures', 'expected-messages.json');

describe('Golden Commit Messages', () => {
  const expectedMessages = JSON.parse(fs.readFileSync(EXPECTED_FILE, 'utf8'));
  const fixtureFiles = fs.readdirSync(FIXTURES_DIR);

  fixtureFiles.forEach(filename => {
    it(`should generate correct message for ${filename}`, () => {
      const diffContent = fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8');
      const expected = expectedMessages[filename];
      
      if (!expected) {
        throw new Error(`No expected message found for fixture: ${filename}`);
      }

      // Mock files array based on diff content (simple parsing for test context)
      // The real implementation will get this from git status
      const files = parseFilesFromDiff(diffContent);
      
      const actual = generateCommitMessage(files, diffContent);
      
      // Normalize line endings for comparison
      const normalizedActual = actual.replace(/\r\n/g, '\n').trim();
      const normalizedExpected = expected.replace(/\r\n/g, '\n').trim();

      assert.strictEqual(normalizedActual, normalizedExpected, `Mismatch in ${filename}`);
    });
  });
});

function parseFilesFromDiff(diff) {
  const files = [];
  const lines = diff.split('\n');
  let currentFile = null;
  let isNew = false;
  let isDeleted = false;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      if (currentFile) {
        files.push({
          file: currentFile,
          status: isNew ? 'A' : isDeleted ? 'D' : 'M'
        });
      }
      isNew = false;
      isDeleted = false;
      // Extract filename from b/path (usually last part)
      const parts = line.split(' ');
      const bPath = parts[parts.length - 1];
      currentFile = bPath.startsWith('b/') ? bPath.slice(2) : bPath;
    } else if (line.startsWith('new file mode')) {
      isNew = true;
    } else if (line.startsWith('deleted file mode')) {
      isDeleted = true;
    }
  }
  
  // Push last file
  if (currentFile) {
    files.push({
      file: currentFile,
      status: isNew ? 'A' : isDeleted ? 'D' : 'M'
    });
  }
  
  return files;
}
