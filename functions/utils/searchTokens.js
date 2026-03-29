'use strict';

const MAX_TOKEN_LEN = 20;
const MIN_TOKEN_LEN = 2;

function normalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function prefixesOf(word) {
  const tokens = [];
  const w = word.slice(0, MAX_TOKEN_LEN);
  for (let i = MIN_TOKEN_LEN; i <= w.length; i++) {
    tokens.push(w.slice(0, i));
  }
  return tokens;
}

function tokensFromText(text) {
  const norm = normalize(text);
  if (!norm) return [];
  const tokens = [];
  const words = norm.split(/\s+/).filter(Boolean);
  for (const word of words) {
    tokens.push(...prefixesOf(word));
  }
  if (words.length > 1) {
    const phrase = words.join(' ').slice(0, MAX_TOKEN_LEN);
    if (phrase.length >= MIN_TOKEN_LEN) tokens.push(phrase);
  }
  return tokens;
}

function buildSearchTokens({ displayName, organization, primaryEmail, allEmails = [] }) {
  const tokenSet = new Set();
  for (const t of tokensFromText(displayName || '')) tokenSet.add(t);
  if (organization) {
    for (const t of tokensFromText(organization)) tokenSet.add(t);
  }
  const emailsToIndex = [primaryEmail, ...allEmails].filter(Boolean);
  for (const email of emailsToIndex) {
    const local = email.split('@')[0];
    if (local) {
      for (const t of tokensFromText(local)) tokenSet.add(t);
    }
  }
  return Array.from(tokenSet).sort();
}

module.exports = { buildSearchTokens, normalize, tokensFromText };
