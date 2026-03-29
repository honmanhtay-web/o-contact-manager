'use strict';

/**
 * scripts/vcf2json.js — VCF (vCard 3.0/4.0) → JSON parser
 *
 * Usage:
 *   const { parseVcf, parseVcfFile } = require('./vcf2json');
 *   const contacts = parseVcf(vcfString);
 *   const contacts = await parseVcfFile('./contacts.vcf');
 *
 * Output format (mỗi contact):
 * {
 *   contact: { displayName, name, emails, phones, organization, categories, ... },
 *   userDefined: { key: value, ... },
 *   vcfRaw: "BEGIN:VCARD\n...\nEND:VCARD"
 * }
 */

const fs = require('fs');
const path = require('path');

// ─── VCF line unfolding ───────────────────────────────────────────────────────

/**
 * Unfold VCF lines (RFC 6350 section 3.2)
 * Dòng tiếp theo bắt đầu bằng SPACE/TAB là continuation của dòng trước
 * @param {string} text
 * @returns {string}
 */
function unfoldLines(text) {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

// ─── Property parser ──────────────────────────────────────────────────────────

/**
 * Parse 1 VCF property line thành { name, params, value }
 * Ví dụ: "EMAIL;TYPE=INTERNET,HOME:user@gmail.com"
 * → { name: "EMAIL", params: { TYPE: ["INTERNET", "HOME"] }, value: "user@gmail.com" }
 *
 * @param {string} line
 * @returns {{ name: string, params: object, value: string }|null}
 */
function parseProp(line) {
  const colonIdx = line.indexOf(':');
  if (colonIdx < 0) return null;

  const propPart = line.slice(0, colonIdx);
  let value = line.slice(colonIdx + 1);

  // Decode quoted-printable nếu có ENCODING=QUOTED-PRINTABLE
  const parts = propPart.split(';');
  const name = parts[0].toUpperCase();
  const params = {};

  for (let i = 1; i < parts.length; i++) {
    const eqIdx = parts[i].indexOf('=');
    if (eqIdx < 0) {
      // Bare param như "QUOTED-PRINTABLE" or "UTF-8"
      params[parts[i].toUpperCase()] = true;
      continue;
    }
    const k = parts[i].slice(0, eqIdx).toUpperCase();
    const v = parts[i].slice(eqIdx + 1);
    // Multiple values: TYPE=INTERNET,HOME
    params[k] = v.includes(',') ? v.split(',') : [v];
  }

  // Decode QUOTED-PRINTABLE
  if (params['ENCODING'] && params['ENCODING'][0] === 'QUOTED-PRINTABLE') {
    value = decodeQuotedPrintable(value);
  }

  // Unescape backslash sequences (\n \, \; \:)
  value = value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');

  return { name, params, value };
}

/**
 * Decode QUOTED-PRINTABLE encoding
 * @param {string} str
 * @returns {string}
 */
function decodeQuotedPrintable(str) {
  return str.replace(/=([0-9A-F]{2})/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

// ─── Single vCard parser ──────────────────────────────────────────────────────

/**
 * Parse 1 vCard string thành contact object
 * @param {string} vcardText — nội dung 1 vCard (BEGIN:VCARD...END:VCARD)
 * @returns {object|null}
 */
function parseVcard(vcardText) {
  const lines = unfoldLines(vcardText).split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return null;

  const contact = {
    displayName: '',
    name: null,
    emails: [],
    phones: [],
    addresses: [],
    organization: '',
    categories: [],
    note: '',
    birthday: null,
    photoUrl: null,
    extensions: {},
  };
  const userDefined = {};

  for (const line of lines) {
    if (!line || line.toUpperCase() === 'BEGIN:VCARD' || line.toUpperCase() === 'END:VCARD') continue;

    const prop = parseProp(line);
    if (!prop) continue;

    const { name, params, value } = prop;

    switch (name) {
      case 'FN':
        contact.displayName = value.trim();
        break;

      case 'N': {
        // N:Family;Given;Middle;Prefix;Suffix
        const parts = value.split(';');
        contact.name = {
          family: parts[0] || '',
          given: parts[1] || '',
          middle: parts[2] || '',
          prefix: parts[3] || '',
          suffix: parts[4] || '',
        };
        // Bỏ field rỗng
        Object.keys(contact.name).forEach(k => {
          if (!contact.name[k]) delete contact.name[k];
        });
        if (!Object.keys(contact.name).length) contact.name = null;
        break;
      }

      case 'EMAIL': {
        const types = params['TYPE'] || ['INTERNET'];
        contact.emails.push({
          type: types.map(t => t.toUpperCase()),
          value: value.toLowerCase().trim(),
          label: params['LABEL'] ? params['LABEL'][0] : null,
        });
        break;
      }

      case 'TEL': {
        const types = params['TYPE'] || ['VOICE'];
        contact.phones.push({
          type: types.map(t => t.toUpperCase()),
          value: value.trim(),
        });
        break;
      }

      case 'ORG':
        // ORG:Company;Department
        contact.organization = value.split(';')[0].trim();
        break;

      case 'CATEGORIES':
        contact.categories = value.split(',').map(c => c.trim()).filter(Boolean);
        break;

      case 'NOTE':
        contact.note = value;
        break;

      case 'BDAY':
        contact.birthday = value.trim();
        break;

      case 'PHOTO':
        // URL type
        if (params['VALUE'] && params['VALUE'][0] === 'URI') {
          contact.photoUrl = value.trim();
        } else if (params['VALUE'] && params['VALUE'][0] === 'URL') {
          contact.photoUrl = value.trim();
        }
        // Bỏ qua base64 embedded photos
        break;

      case 'ADR': {
        // ADR:POBox;Extended;Street;City;State;Zip;Country
        const parts = value.split(';');
        const types = params['TYPE'] || ['HOME'];
        contact.addresses.push({
          type: types.map(t => t.toUpperCase()),
          poBox: parts[0] || '',
          street: parts[2] || '',
          city: parts[3] || '',
          state: parts[4] || '',
          zip: parts[5] || '',
          country: parts[6] || '',
        });
        break;
      }

      default:
        // X- extensions và X-ABRELATEDNAMES, X-GOOGLE-*, v.v.
        if (name.startsWith('X-')) {
          const xKey = name.slice(2); // bỏ "X-"
          // X-ABCW keys có thể là userDefined (ví dụ X-GITHUB-TOKEN)
          if (xKey.includes('-')) {
            // Chuyển X-GITHUB-TOKEN → github.token
            const udKey = xKey.toLowerCase().replace(/-/g, '.');
            userDefined[udKey] = value;
          } else {
            contact.extensions[xKey] = value;
          }
        }
        break;
    }
  }

  // Tạo displayName từ N nếu FN trống
  if (!contact.displayName && contact.name) {
    const n = contact.name;
    contact.displayName = [n.prefix, n.given, n.middle, n.family, n.suffix]
      .filter(Boolean)
      .join(' ');
  }

  // Bỏ field rỗng
  if (!contact.note) delete contact.note;
  if (!contact.birthday) delete contact.birthday;
  if (!contact.photoUrl) delete contact.photoUrl;
  if (!contact.organization) delete contact.organization;
  if (!contact.addresses.length) delete contact.addresses;
  if (!Object.keys(contact.extensions).length) delete contact.extensions;
  if (!contact.name) delete contact.name;

  return {
    contact,
    userDefined,
    vcfRaw: vcardText.trim(),
  };
}

// ─── Multi-vCard parser ───────────────────────────────────────────────────────

/**
 * Parse chuỗi VCF chứa nhiều vCards
 * @param {string} vcfText
 * @returns {object[]} mảng contact objects
 */
function parseVcf(vcfText) {
  if (!vcfText || typeof vcfText !== 'string') return [];

  // Split theo BEGIN:VCARD / END:VCARD
  const vcardRegex = /BEGIN:VCARD[\s\S]*?END:VCARD/gi;
  const matches = vcfText.match(vcardRegex) || [];

  const results = [];
  for (const vcardText of matches) {
    const contact = parseVcard(vcardText);
    if (contact && (contact.contact.displayName || contact.contact.emails.length)) {
      results.push(contact);
    }
  }

  return results;
}

/**
 * Parse file VCF từ disk
 * @param {string} filePath
 * @returns {Promise<object[]>}
 */
async function parseVcfFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const text = await fs.promises.readFile(absolutePath, 'utf8');
  return parseVcf(text);
}

// ─── CLI usage ────────────────────────────────────────────────────────────────
if (require.main === module) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile) {
    console.error('Usage: node vcf2json.js <input.vcf> [output.json]');
    process.exit(1);
  }

  parseVcfFile(inputFile)
    .then(contacts => {
      const json = JSON.stringify(contacts, null, 2);
      if (outputFile) {
        fs.writeFileSync(outputFile, json, 'utf8');
        console.log(`✅ Parsed ${contacts.length} contacts → ${outputFile}`);
      } else {
        console.log(json);
      }
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { parseVcf, parseVcfFile, parseVcard };
