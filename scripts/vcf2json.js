#!/usr/bin/env node
"use strict";

/**
 * scripts/vcf2json.js — VCF (vCard) 3.0 / 4.0 parser
 *
 * Parse file VCF thành mảng JSON theo schema contacts_detail
 *
 * Usage (module):
 *   const { parseVcfFile, parseVcfString } = require('./vcf2json');
 *   const contacts = await parseVcfFile('./contacts.vcf');
 *
 * Usage (CLI):
 *   node scripts/vcf2json.js input.vcf
 *   node scripts/vcf2json.js input.vcf --output output.json
 *   node scripts/vcf2json.js input.vcf --stats
 */

const fs = require("fs");
const path = require("path");

// ─── VCF Line Unfolding ───────────────────────────────────────────────────────

/**
 * VCF dùng "line folding" — dòng dài bị gấp với CRLF + whitespace
 * Unfold: ghép lại thành 1 dòng
 */
function unfoldLines(raw) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, ""); // unfold
}

// ─── Property Parser ──────────────────────────────────────────────────────────

/**
 * Parse 1 VCF property line thành { name, params, value }
 *
 * Ví dụ:
 *   "EMAIL;TYPE=INTERNET,WORK:john@work.com"
 *   → { name: 'EMAIL', params: { TYPE: ['INTERNET','WORK'] }, value: 'john@work.com' }
 *
 *   "item1.EMAIL;TYPE=INTERNET:john@gmail.com"
 *   → { name: 'EMAIL', group: 'item1', params: {...}, value: '...' }
 */
function parsePropLine(line) {
  // Tách group.name;params:value
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return null;

  const nameAndParams = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);

  const parts = nameAndParams.split(";");
  let nameWithGroup = parts[0];
  const paramParts = parts.slice(1);

  // Tách group prefix (e.g. "item1.EMAIL")
  // Lưu ý: X-custom.key KHÔNG phải group — chỉ tách nếu phần sau dấu . là tên prop hợp lệ
  let group = null;
  const dotIdx = nameWithGroup.indexOf(".");
  if (dotIdx !== -1 && !nameWithGroup.toUpperCase().startsWith("X-")) {
    group = nameWithGroup.slice(0, dotIdx).toLowerCase();
    nameWithGroup = nameWithGroup.slice(dotIdx + 1);
  }

  const name = nameWithGroup.toUpperCase();

  // Parse params
  const params = {};
  for (const p of paramParts) {
    const eqIdx = p.indexOf("=");
    if (eqIdx === -1) {
      // Shorthand: TYPE=value (vCard 2.1 style)
      params["TYPE"] = params["TYPE"] || [];
      params["TYPE"].push(p.toUpperCase());
    } else {
      const paramName = p.slice(0, eqIdx).toUpperCase();
      const paramVal = p.slice(eqIdx + 1);
      params[paramName] = params[paramName] || [];
      params[paramName].push(...paramVal.split(",").map((v) => v.toUpperCase().replace(/^"|"$/g, "")));
    }
  }

  return { name, group, params, value: decodeValue(value, params["ENCODING"]?.[0]) };
}

// ─── Value Decoding ───────────────────────────────────────────────────────────

function decodeValue(value, encoding) {
  if (!encoding) return unescapeVcf(value);
  if (encoding === "QUOTED-PRINTABLE") return decodeQP(value);
  if (encoding === "BASE64" || encoding === "B") return value; // Keep raw base64
  return unescapeVcf(value);
}

function unescapeVcf(str) {
  if (!str) return "";
  return str.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function decodeQP(str) {
  try {
    // Simple QP decode
    return str
      .replace(/=\r?\n/g, "") // soft line break
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  } catch {
    return str;
  }
}

// ─── Structured Value Parsers ─────────────────────────────────────────────────

/** N field: "Family;Given;Middle;Prefix;Suffix" */
function parseName(value) {
  const [family = "", given = "", middle = "", prefix = "", suffix = ""] = value.split(";").map((s) => s.trim());
  const result = {};
  if (family) result.family = family;
  if (given) result.given = given;
  if (middle) result.middle = middle;
  if (prefix) result.prefix = prefix;
  if (suffix) result.suffix = suffix;
  return Object.keys(result).length ? result : null;
}

/** ADR field: "PO Box;Ext;Street;City;Region;Postal;Country" */
function parseAddress(value) {
  const [poBox, ext, street, city, region, postal, country] = value.split(";").map((s) => s.trim());
  const result = {};
  if (poBox) result.poBox = poBox;
  if (ext) result.ext = ext;
  if (street) result.street = street;
  if (city) result.city = city;
  if (region) result.region = region;
  if (postal) result.postal = postal;
  if (country) result.country = country;
  return Object.keys(result).length ? result : null;
}

// ─── vCard Block Parser ───────────────────────────────────────────────────────

/**
 * Parse 1 vCard block (BEGIN:VCARD → END:VCARD) thành contact JSON
 * Output format tương thích với contacts_detail.contact + userDefined
 */
function parseVcard(lines) {
  const props = lines
    .filter((l) => l && !["BEGIN:VCARD", "END:VCARD", "VERSION:2.1", "VERSION:3.0", "VERSION:4.0"].some((skip) => l.startsWith(skip)))
    .map(parsePropLine)
    .filter(Boolean);

  const contact = {};
  const userDefined = {};
  const extensions = {};
  let vcfRaw = lines.join("\r\n");

  for (const prop of props) {
    const { name, params, value, group } = prop;
    const types = params["TYPE"] || [];

    switch (name) {
      case "FN":
        contact.displayName = value;
        break;

      case "N": {
        const n = parseName(value);
        if (n) contact.name = n;
        break;
      }

      case "EMAIL": {
        if (!value || !value.includes("@")) break;
        contact.emails = contact.emails || [];
        const emailType = types.length ? types : ["INTERNET"];
        contact.emails.push({
          type: emailType,
          value: value.toLowerCase().trim(),
          ...(group ? { group } : {}),
        });
        break;
      }

      case "TEL": {
        if (!value) break;
        contact.phones = contact.phones || [];
        const telType = types.length ? types : ["VOICE"];
        contact.phones.push({
          type: telType,
          value: value.trim(),
        });
        break;
      }

      case "ORG": {
        // ORG: "Company;Department;Unit"
        const orgParts = value.split(";").filter(Boolean);
        if (orgParts[0]) {
          contact.organization = orgParts[0].trim();
          if (orgParts[1]) contact.department = orgParts[1].trim();
        }
        break;
      }

      case "TITLE":
        if (value) contact.title = value.trim();
        break;

      case "ADR": {
        const addr = parseAddress(value);
        if (addr) {
          contact.addresses = contact.addresses || [];
          contact.addresses.push({
            type: types.length ? types : ["HOME"],
            ...addr,
          });
        }
        break;
      }

      case "URL":
        if (value) {
          contact.urls = contact.urls || [];
          contact.urls.push({ type: types.length ? types : ["HOME"], value: value.trim() });
        }
        break;

      case "NOTE":
        if (value) contact.note = value.trim();
        break;

      case "BDAY":
        if (value) contact.birthday = value.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3").trim();
        break;

      case "NICKNAME":
        if (value) contact.nickname = value.trim();
        break;

      case "PHOTO":
        // Lưu type để biết có ảnh, không lưu raw base64 vào contact
        if (value) contact.hasPhoto = true;
        break;

      case "CATEGORIES": {
        // "myContacts,friends" hoặc "myContacts;friends"
        const cats = value
          .split(/[,;]/)
          .map((c) => c.trim())
          .filter(Boolean);
        if (cats.length) contact.categories = cats;
        break;
      }

      case "UID":
        if (value) contact.uid = value.trim();
        break;

      case "REV":
        if (value) contact.rev = value.trim();
        break;

      default:
        // X-custom fields → extensions hoặc userDefined
        if (name.startsWith("X-")) {
          const cleanName = name.slice(2); // Remove X- prefix

          // Một số X- fields phổ biến có tên riêng
          if (name === "X-GOOGLE-TALK" || name === "X-JABBER") {
            contact.ims = contact.ims || [];
            contact.ims.push({ type: [cleanName], value: value.trim() });
          } else if (name === "X-ABLABEL") {
            // iCloud label — bỏ qua
          } else {
            // Lưu vào extensions — dùng chữ thường để key nhất quán
            const extKey = cleanName.toLowerCase();
            extensions[extKey] = value.trim();
          }
        }
        break;
    }
  }

  // Map extensions sang userDefined nếu có
  // Giữ nguyên tên extension key
  Object.assign(userDefined, extensions);

  // Nếu không có displayName, tự sinh từ name
  if (!contact.displayName && contact.name) {
    const n = contact.name;
    const parts = [n.prefix, n.given, n.middle, n.family, n.suffix].filter(Boolean);
    if (parts.length) contact.displayName = parts.join(" ");
  }

  // Nếu vẫn không có displayName, dùng email đầu tiên
  if (!contact.displayName && contact.emails?.length) {
    contact.displayName = contact.emails[0].value;
  }

  // Set default categories nếu chưa có
  if (!contact.categories) contact.categories = [];

  return {
    contact,
    ...(Object.keys(userDefined).length ? { userDefined } : {}),
    vcfRaw,
  };
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

/**
 * Parse VCF string thành mảng contact JSON
 * @param {string} vcfString — nội dung file VCF
 * @returns {Array} mảng { contact, userDefined?, vcfRaw }
 */
function parseVcfString(vcfString) {
  const unfolded = unfoldLines(vcfString);
  const lines = unfolded.split("\n");

  const contacts = [];
  let currentBlock = [];
  let inCard = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.toUpperCase() === "BEGIN:VCARD") {
      currentBlock = [trimmed];
      inCard = true;
    } else if (trimmed.toUpperCase() === "END:VCARD") {
      currentBlock.push(trimmed);
      inCard = false;

      try {
        const parsed = parseVcard(currentBlock);
        // Chỉ thêm nếu có ít nhất displayName hoặc email
        if (parsed.contact.displayName || parsed.contact.emails?.length) {
          contacts.push(parsed);
        }
      } catch (err) {
        console.warn("[vcf2json] Skipped malformed vCard:", err.message);
      }

      currentBlock = [];
    } else if (inCard) {
      currentBlock.push(trimmed);
    }
  }

  return contacts;
}

/**
 * Parse VCF file thành mảng contact JSON
 * @param {string} filePath — đường dẫn đến file VCF
 * @returns {Promise<Array>}
 */
async function parseVcfFile(filePath) {
  const resolved = path.resolve(filePath);
  const content = fs.readFileSync(resolved, "utf8");
  return parseVcfString(content);
}

// ─── Stats Helper ─────────────────────────────────────────────────────────────

function printStats(contacts) {
  const total = contacts.length;
  const withEmail = contacts.filter((c) => c.contact.emails?.length).length;
  const withPhone = contacts.filter((c) => c.contact.phones?.length).length;
  const withOrg = contacts.filter((c) => c.contact.organization).length;
  const withUD = contacts.filter((c) => c.userDefined && Object.keys(c.userDefined).length).length;
  const withPhoto = contacts.filter((c) => c.contact.hasPhoto).length;
  const catSet = new Set(contacts.flatMap((c) => c.contact.categories || []));
  const emailTotal = contacts.reduce((s, c) => s + (c.contact.emails?.length || 0), 0);

  console.log("\n📊 VCF Parse Stats:");
  console.log("━".repeat(40));
  console.log(`  Total contacts:    ${total}`);
  console.log(`  With email:        ${withEmail} (${Math.round((withEmail / total) * 100)}%)`);
  console.log(`  Total emails:      ${emailTotal}`);
  console.log(`  With phone:        ${withPhone}`);
  console.log(`  With organization: ${withOrg}`);
  console.log(`  With userDefined:  ${withUD}`);
  console.log(`  With photo:        ${withPhoto}`);
  console.log(`  Categories:        ${[...catSet].join(", ") || "(none)"}`);
  console.log("━".repeat(40));
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const inputFile = args.find((a) => !a.startsWith("--"));
  const outputFile = args[args.indexOf("--output") + 1];
  const statsOnly = args.includes("--stats");

  if (!inputFile) {
    console.error("Usage: node scripts/vcf2json.js <input.vcf> [--output output.json] [--stats]");
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  console.log(`\n📂 Parsing: ${inputFile}`);

  parseVcfFile(inputFile)
    .then((contacts) => {
      console.log(`✅ Parsed ${contacts.length} contacts`);

      if (statsOnly || args.includes("--stats")) {
        printStats(contacts);
      }

      if (outputFile) {
        fs.writeFileSync(outputFile, JSON.stringify(contacts, null, 2), "utf8");
        console.log(`💾 Saved to: ${outputFile}`);
      } else if (!statsOnly) {
        console.log(JSON.stringify(contacts, null, 2));
      }
    })
    .catch((err) => {
      console.error("Error:", err.message);
      process.exit(1);
    });
}

module.exports = { parseVcfFile, parseVcfString, parseVcard, parsePropLine };
