(function (global) {
  const PRICE_RE = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/g;
  const WEIGHT_RE = /\b(\d+(?:[,.]\d+)?\s*(?:kg|g|ml|l|un|und|unid))\b/gi;
  const NODE_ZLIB =
    typeof require === "function"
      ? (() => {
          try {
            return require("zlib");
          } catch {
            return null;
          }
        })()
      : null;

  function asciiKey(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function allMatches(regex, value) {
    regex.lastIndex = 0;
    return Array.from(String(value || "").matchAll(regex));
  }

  function normalizePrice(value) {
    const digits = String(value || "").replace(/[^\d,]/g, "");
    if (!digits) return "";
    const splitAt = digits.lastIndexOf(",");
    const reais = (splitAt >= 0 ? digits.slice(0, splitAt) : digits).replace(/\./g, "") || "0";
    const cents = splitAt >= 0 ? digits.slice(splitAt + 1) : "00";
    return `${Number(reais).toLocaleString("pt-BR")},${cents.slice(0, 2).padEnd(2, "0")}`;
  }

  function cleanName(value) {
    let text = String(value || "").replace(/\s+/g, " ").trim();
    text = text.replace(PRICE_RE, " ");
    text = text.replace(/\bR\$\b|\bde\b|\bpor\b/gi, " ");
    text = text.replace(/^\d{1,8}\s+|\s+\d{6,14}\s*$/g, "").trim();
    text = text.replace(/\b(?:cod|codigo|código|ean|barra|barras|preco|preço|valor|venda)\b[:\s-]*/gi, "");
    text = text.replace(/\s{2,}/g, " ").replace(/^[\s\-;:]+|[\s\-;:]+$/g, "");
    return text.toLowerCase().replace(/(^|[^A-Za-zÀ-ÿ])([a-zà-ÿ])/g, (_, prefix, letter) => {
      return prefix + letter.toUpperCase();
    });
  }

  function extractWeight(name) {
    const matches = allMatches(WEIGHT_RE, name);
    if (!matches.length) return [name, ""];
    const weightMatch = matches[matches.length - 1];
    const rawWeight = weightMatch[1];
    const weight = rawWeight.replace(/\s+/g, "").toLowerCase();
    const cleaned = `${name.slice(0, weightMatch.index)} ${name.slice(weightMatch.index + rawWeight.length)}`.trim();
    return [cleaned, weight];
  }

  function stripLeftColumns(value) {
    let text = String(value || "").replace(/\s+/g, " ").trim();
    for (let index = 0; index < 4; index += 1) {
      text = text.replace(/^(?:\d+|[\d./-]+|[A-Z]{1,4}\d+|\d{6,14})\s+/i, "").trim();
    }
    return text;
  }

  function descriptionUntilLastWeight(rowText) {
    const prices = allMatches(PRICE_RE, rowText);
    let source = String(rowText || "");
    if (prices.length) {
      const last = prices[prices.length - 1];
      source = rowText.slice(0, last.index);
    }
    source = stripLeftColumns(source);
    const matches = allMatches(WEIGHT_RE, source);
    if (!matches.length) return "";
    const last = matches[matches.length - 1];
    return source.slice(0, last.index + last[1].length).trim();
  }

  function repairDescriptionTail(name, weight, rowText = "") {
    let cleanedName = cleanName(name);
    let normalizedWeight = String(weight || "").replace(/\s+/g, "").toLowerCase();
    const rebuilt = descriptionUntilLastWeight(rowText);

    if (rebuilt) {
      let [rebuiltName, rebuiltWeight] = extractWeight(cleanName(rebuilt));
      rebuiltName = cleanName(rebuiltName);
      if (rebuiltName && (!normalizedWeight || rebuiltName.length > cleanedName.length)) {
        cleanedName = rebuiltName;
        normalizedWeight = rebuiltWeight;
      }
    }

    cleanedName = cleanedName.replace(/\bnull\b/gi, " ");
    cleanedName = cleanedName.replace(/\bInforma[cç][aã]o Confidencial\b.*$/i, "").trim();
    cleanedName = cleanedName.replace(/\bP[aá]gina\s+\d+\s+de\s+\d+\b/gi, "").trim();
    cleanedName = cleanedName.replace(/\bUN\b$/i, "").trim();
    cleanedName = cleanedName.replace(/\bUNID\b$/i, "").trim();

    const kgMatch = cleanedName.match(/(?:^|\s)KG$/i);
    if (kgMatch) {
      cleanedName = cleanedName.slice(0, kgMatch.index).trim();
      normalizedWeight = "kg";
    }

    return [cleanName(cleanedName), normalizedWeight];
  }

  function bytesToLatin1(bytes) {
    const chunkSize = 0x8000;
    const chunks = [];
    for (let index = 0; index < bytes.length; index += chunkSize) {
      chunks.push(String.fromCharCode(...bytes.subarray(index, index + chunkSize)));
    }
    return chunks.join("");
  }

  function latin1ToBytes(value) {
    const bytes = new Uint8Array(value.length);
    for (let index = 0; index < value.length; index += 1) {
      bytes[index] = value.charCodeAt(index) & 0xff;
    }
    return bytes;
  }

  async function inflateBytes(bytes) {
    if (NODE_ZLIB) {
      return new Uint8Array(NODE_ZLIB.inflateSync(bytes));
    }

    if (!global.DecompressionStream) {
      throw new Error("Este navegador não consegue ler o PDF direto. Use Chrome, Edge ou Safari atualizado.");
    }

    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function decodePdfLiteral(value) {
    const bytes = [];
    for (let index = 0; index < value.length; index += 1) {
      const char = value[index];
      if (char !== "\\") {
        bytes.push(char.charCodeAt(0) & 0xff);
        continue;
      }

      index += 1;
      const escaped = value[index];
      if (escaped === undefined) break;
      if (escaped === "n") bytes.push(10);
      else if (escaped === "r") bytes.push(13);
      else if (escaped === "t") bytes.push(9);
      else if (escaped === "b") bytes.push(8);
      else if (escaped === "f") bytes.push(12);
      else if (/[0-7]/.test(escaped)) {
        let octal = escaped;
        for (let count = 0; count < 2 && /[0-7]/.test(value[index + 1] || ""); count += 1) {
          index += 1;
          octal += value[index];
        }
        bytes.push(parseInt(octal, 8) & 0xff);
      } else {
        bytes.push(escaped.charCodeAt(0) & 0xff);
      }
    }
    return bytesToLatin1(new Uint8Array(bytes)).replace(/\s+/g, " ").trim();
  }

  async function extractStreams(pdfBytes) {
    const pdfText = bytesToLatin1(pdfBytes);
    const streams = [];
    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match;

    while ((match = streamRegex.exec(pdfText))) {
      const raw = latin1ToBytes(match[1]);
      try {
        streams.push(bytesToLatin1(await inflateBytes(raw)));
      } catch (error) {
        if (/navegador/i.test(error.message || "")) {
          throw error;
        }
        streams.push(bytesToLatin1(raw));
      }
    }

    return streams;
  }

  function extractTextFragments(content) {
    const fragments = [];
    const lines = content.split(/\r?\n/);
    let x = 0;
    let y = 0;

    for (const line of lines) {
      const tm = line.match(/\b1\s+0\s+0\s+1\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Tm\b/);
      if (tm) {
        x = Number(tm[1]);
        y = Number(tm[2]);
      }

      const tjRegex = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
      let tj;
      while ((tj = tjRegex.exec(line))) {
        const text = decodePdfLiteral(tj[1]);
        if (text) fragments.push({ text, x, y });
      }

      const tjArrayRegex = /\[((?:\s*(?:\((?:\\.|[^\\)])*\)|-?\d+(?:\.\d+)?)\s*)+)\]\s*TJ/g;
      let tjArray;
      while ((tjArray = tjArrayRegex.exec(line))) {
        const parts = [];
        let textPart;
        const literalRegex = /\(((?:\\.|[^\\)])*)\)/g;
        while ((textPart = literalRegex.exec(tjArray[1]))) {
          parts.push(decodePdfLiteral(textPart[1]));
        }
        const text = parts.join("").replace(/\s+/g, " ").trim();
        if (text) fragments.push({ text, x, y });
      }
    }

    return fragments;
  }

  function groupRows(fragments, tolerance = 3.5) {
    const rows = [];
    for (const fragment of [...fragments].sort((a, b) => b.y - a.y)) {
      const row = rows.find((candidate) => Math.abs(candidate.y - fragment.y) <= tolerance);
      if (row) {
        row.fragments.push(fragment);
        row.y = (row.y + fragment.y) / 2;
      } else {
        rows.push({ y: fragment.y, fragments: [fragment] });
      }
    }

    for (const row of rows) {
      row.fragments.sort((a, b) => a.x - b.x);
    }

    return rows;
  }

  function findDescriptionBounds(fragments) {
    const headers = fragments.filter((fragment) => asciiKey(fragment.text).includes("descri"));
    if (!headers.length) return null;
    const header = [...headers].sort((a, b) => b.y - a.y)[0];
    const sameHeader = fragments.filter((fragment) => Math.abs(fragment.y - header.y) <= 8 && fragment.x > header.x + 20);
    const rightX = sameHeader.length ? Math.min(...sameHeader.map((fragment) => fragment.x)) : Math.max(...fragments.map((fragment) => fragment.x)) + 200;
    return { descX: header.x, rightX, headerY: header.y };
  }

  function parsePositionedFragments(fragments) {
    const bounds = findDescriptionBounds(fragments);
    if (!bounds) return [];

    const rows = groupRows(fragments).filter((row) => row.y < bounds.headerY - 8);
    const items = [];
    let pending = null;

    function descriptionText(row) {
      return row.fragments
        .filter((fragment) => fragment.x >= bounds.descX - 4 && fragment.x < bounds.rightX - 4)
        .map((fragment) => fragment.text)
        .join(" ")
        .trim();
    }

    function flushPending() {
      if (!pending) return;
      let description = cleanName(pending.descriptionParts.join(" "));
      let weight;
      [description, weight] = extractWeight(description);
      description = cleanName(description);
      [description, weight] = repairDescriptionTail(description, weight, pending.rowText);
      if (description && description.length >= 3 && !/subtotal|total|relatorio|pagina|descri/.test(asciiKey(description))) {
        items.push({ name: description, weight, price: normalizePrice(pending.price) });
      }
      pending = null;
    }

    for (const row of rows) {
      const rowText = row.fragments.map((fragment) => fragment.text).join(" ");
      const prices = allMatches(PRICE_RE, rowText);
      const descText = descriptionText(row);
      if (!descText) continue;

      const hasProductCode = row.fragments.some((fragment) => fragment.x < bounds.descX - 20 && /^\d+$/.test(fragment.text));
      if (prices.length && hasProductCode) {
        flushPending();
        pending = {
          descriptionParts: [descText],
          price: prices[prices.length - 1][1],
          rowText,
        };
        continue;
      }

      if (pending && !prices.length) {
        if (/Informa[cç][aã]o Confidencial|P[aá]gina\s+\d+\s+de\s+\d+/i.test(rowText)) continue;
        pending.descriptionParts.push(descText);
        pending.rowText += ` ${rowText}`;
      }
    }

    flushPending();
    return items;
  }

  function uniqueItems(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = `${item.name.toLowerCase()}|${item.weight.toLowerCase()}|${item.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function extractWithPdfJs(arrayBuffer) {
    const pdfjsUrl =
      typeof document !== "undefined"
        ? new URL("./vendor/pdfjs/pdf.mjs", document.currentScript ? document.currentScript.src : global.location.href).href
        : "./vendor/pdfjs/pdf.mjs";
    const loadPdfJs = new Function("url", "return import(url)");
    const pdfjs = await loadPdfJs(pdfjsUrl);

    if (pdfjs.GlobalWorkerOptions && typeof document !== "undefined") {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.mjs", pdfjsUrl).href;
    }

    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer), disableFontFace: true });
    const pdf = await loadingTask.promise;
    const items = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent({
        disableCombineTextItems: false,
        includeMarkedContent: false,
      });
      const fragments = textContent.items
        .filter((item) => item && typeof item.str === "string" && item.str.trim())
        .map((item) => ({
          text: item.str.replace(/\s+/g, " ").trim(),
          x: item.transform[4],
          y: item.transform[5],
        }));
      items.push(...parsePositionedFragments(fragments));
    }

    return uniqueItems(items);
  }

  async function extractWithBuiltInReader(arrayBuffer) {
    const pdfBytes = new Uint8Array(arrayBuffer);
    const items = [];
    const streams = await extractStreams(pdfBytes);

    for (const stream of streams) {
      const fragments = extractTextFragments(stream);
      if (!fragments.length) continue;
      items.push(...parsePositionedFragments(fragments));
    }

    return uniqueItems(items);
  }

  async function extractRelatorio5301FromArrayBuffer(arrayBuffer) {
    const pdfJsItems = await extractWithPdfJs(arrayBuffer).catch(() => []);
    if (pdfJsItems.length) return pdfJsItems;
    return extractWithBuiltInReader(arrayBuffer);
  }

  global.extractRelatorio5301FromArrayBuffer = extractRelatorio5301FromArrayBuffer;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { extractRelatorio5301FromArrayBuffer };
  }
})(typeof window !== "undefined" ? window : globalThis);
