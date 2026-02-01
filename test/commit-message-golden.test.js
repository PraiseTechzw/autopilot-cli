const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { describe, it } = require('node:test');
const { generateCommitMessage } = require('../src/core/commit');

const FIXTURES_DIR = path.join(__dirname, 'fixtures/diffs');
const EXPECTED_MESSAGES = require('./fixtures/expected-messages.json');

describe('Golden Commit Messages', () => {
  const fixtureFiles = fs.readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.diff'));

  fixtureFiles.forEach(filename => {
    it(`should generate correct message for ${filename}`, () => {
      const diffContent = fs.readFileSync(path.join(FIXTURES_DIR, filename), 'utf8');
      const expected = EXPECTED_MESSAGES[filename];
      
      // Simulate file list from diff
      const files = parseFilesFromDiff(diffContent);
      
      const actual = generateCommitMessage(files, diffContent);
      
      // Normalize line endings
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

  lines.forEach(line => {
    if (line.startsWith('diff --git')) {
      if (currentFile) {
        files.push({ file: currentFile, status: isNew ? 'A ' : 'M ' });
      }
      const parts = line.split(' ');
      const bPart = parts[parts.length - 1];
      currentFile = bPart.startsWith('b/') ? bPart.slice(2) : bPart;
      isNew = false;
    } else if (line.startsWith('new file mode')) {
      isNew = true;
    }
  });

  if (currentFile) {
    files.push({ file: currentFile, status: isNew ? 'A ' : 'M ' });
  }

  return files;
}
