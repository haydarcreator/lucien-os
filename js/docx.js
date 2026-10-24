/* Lucien Office — export .docx (Word) sans bibliothèque : HTML → WordprocessingML, puis archive ZIP */
"use strict";
const Docx = (() => {
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  /* archive ZIP sans compression (méthode « stored »), lisible par Word et LibreOffice */
  function zip(files) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    for (const [name, text] of files) {
      const data = enc.encode(text), nm = enc.encode(name), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, nm.length, true);
      parts.push(new Uint8Array(h.buffer), nm, data);
      const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nm);
      off += 30 + nm.length + data.length;
    }
    const size = central.reduce((s, a) => s + a.length, 0);
    const e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }
  const x = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hexColor = (c) => { const m = /rgb\((\d+),\s*(\d+),\s*(\d+)/.exec(c || ""); return m ? m.slice(1).map(n => (+n).toString(16).padStart(2, "0")).join("") : /^#([0-9a-f]{6})$/i.test(c || "") ? c.slice(1) : null; };
  function runs(el, fmt = {}) {
    let out = "";
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        if (!n.data) continue;
        const p = [fmt.b && "<w:b/>", fmt.i && "<w:i/>", fmt.u && '<w:u w:val="single"/>', fmt.s && "<w:strike/>", fmt.color && `<w:color w:val="${fmt.color}"/>`, fmt.hl && '<w:highlight w:val="yellow"/>', fmt.sz && `<w:sz w:val="${fmt.sz}"/>`, fmt.vert && `<w:vertAlign w:val="${fmt.vert}"/>`].filter(Boolean).join("");
        out += `<w:r>${p ? `<w:rPr>${p}</w:rPr>` : ""}<w:t xml:space="preserve">${x(n.data)}</w:t></w:r>`;
      } else if (n.nodeType === 1) {
        if (n.tagName === "BR") { out += "<w:r><w:br/></w:r>"; continue; }
        if (n.matches(".wm,del.trk")) continue;
        const f = { ...fmt }, t = n.tagName, st = n.style;
        if (t === "B" || t === "STRONG" || +st.fontWeight >= 600 || st.fontWeight === "bold") f.b = 1;
        if (t === "I" || t === "EM" || st.fontStyle === "italic") f.i = 1;
        if (t === "U" || /underline/.test(st.textDecoration)) f.u = 1;
        if (t === "S" || t === "STRIKE" || /line-through/.test(st.textDecoration)) f.s = 1;
        if (t === "SUB") f.vert = "subscript"; if (t === "SUP") f.vert = "superscript";
        if (t === "MARK") f.hl = 1;
        const col = hexColor(st.color || n.getAttribute("color")); if (col) f.color = col;
        if (st.fontSize && /pt$/.test(st.fontSize)) f.sz = Math.round(parseFloat(st.fontSize) * 2);
        out += runs(n, f);
      }
    }
    return out;
  }
  function para(el, style, extra = "") {
    const al = { center: "center", right: "right", justify: "both" }[el.style?.textAlign] || "";
    const pPr = (style ? `<w:pStyle w:val="${style}"/>` : "") + (al ? `<w:jc w:val="${al}"/>` : "") + extra;
    return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ""}${runs(el)}</w:p>`;
  }
  function blocks(root) {
    let out = "";
    for (const n of root.children) {
      const t = n.tagName;
      if (n.matches(".wm,.whf,.toc")) continue;
      if (t === "H1") out += para(n, "Heading1"); else if (t === "H2") out += para(n, "Heading2"); else if (t === "H3") out += para(n, "Heading3");
      else if (t === "BLOCKQUOTE") out += para(n, "Quote");
      else if (t === "UL" || t === "OL") [...n.children].forEach((li, i) => { const pre = document.createElement("span"); pre.textContent = t === "UL" ? "• " : `${i + 1}. `; li.prepend(pre); out += para(li, "", '<w:ind w:left="720" w:hanging="360"/>'); pre.remove(); });
      else if (t === "TABLE") out += `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(b => `<w:${b} w:val="single" w:sz="4" w:color="8EAADB"/>`).join("")}</w:tblBorders></w:tblPr>${[...n.rows].map(r => `<w:tr>${[...r.cells].map(c => `<w:tc>${para(c)}</w:tc>`).join("")}</w:tr>`).join("")}</w:tbl><w:p/>`;
      else if (n.classList.contains("pbreak")) out += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      else if (t === "HR") out += '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:color="999999"/></w:pBdr></w:pPr></w:p>';
      else if (t === "DIV" && n.querySelector("p,h1,h2,h3,ul,ol,table")) out += blocks(n);
      else out += para(n);
    }
    return out;
  }
  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/><w:color w:val="1F3864"/><w:sz w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/><w:color w:val="2F5496"/><w:sz w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:color w:val="1F3763"/><w:sz w:val="24"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="864" w:right="864"/></w:pPr><w:rPr><w:i/><w:color w:val="404040"/></w:rPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style></w:styles>`;
  function fromHTML(html, opts = {}) {
    const root = document.createElement("div"); root.innerHTML = html;
    const body = blocks(root);
    const sect = opts.landscape ? '<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>' : '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1417" w:right="1417" w:bottom="1417" w:left="1417" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';
    return zip([
      ["[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'],
      ["_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'],
      ["docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(opts.title || "Document")}</dc:title><dc:creator>Lucien</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`],
      ["word/_rels/document.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ["word/styles.xml", STYLES],
      ["word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}${sect}</w:body></w:document>`]
    ]);
  }
  return { fromHTML, zip, crc32 };
})();
