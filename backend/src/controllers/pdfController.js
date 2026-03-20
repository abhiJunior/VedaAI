import PDFDocument from 'pdfkit';
import Assignment from '../models/Assignment.js';

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// GET /api/assignments/:id/pdf
export const generatePDF = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    if (assignment.status !== 'completed' || !assignment.result?.sections?.length) {
      return res.status(400).json({ error: 'Question paper is not ready yet' });
    }

    const paper   = assignment.result;
    const subject = assignment.subject || paper.subject || 'Subject';
    const grade   = assignment.grade   || paper.grade   || 'N/A';
    const marks   = assignment.totalMarks || paper.totalMarks || 'N/A';
    const time    = assignment.timeAllowed || paper.timeAllowed || '3 Hours';
    const title   = paper.paperTitle || `${subject} Question Paper`;
    const safeName = title.replace(/[^\w\s\-]/gi, '').trim().replace(/\s+/g, '_') || 'question_paper';

    // ── Document setup ────────────────────────────────────────────────────────
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 50, left: 50, right: 50 },
      autoFirstPage: true,
      info: { Title: title, Author: 'VedaAI', Subject: subject },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    doc.pipe(res);

    const L   = doc.page.margins.left;          // 50
    const R   = doc.page.margins.right;          // 50
    const W   = doc.page.width - L - R;         // usable width
    const BOT = doc.page.height - doc.page.margins.bottom;

    // ── Colour palette ─────────────────────────────────────────────────────
    const C = {
      dark:   '#1a1a2e',
      orange: '#E8521A',
      gray:   '#6b7280',
      border: '#e5e7eb',
      light:  '#f9fafb',
      white:  '#ffffff',
      text:   '#111827',
    };

    // ── Helper: check if we need a new page ───────────────────────────────
    function ensureSpace(needed) {
      if (doc.y + needed > BOT) doc.addPage();
    }

    // ── Helper: draw a bordered box, return its top Y ─────────────────────
    function drawBox(y, h, fill = null) {
      if (fill) doc.rect(L, y, W, h).fill(fill);
      doc.rect(L, y, W, h).strokeColor(C.border).lineWidth(0.6).stroke();
      return y;
    }

    // ── HEADER (dark bar) ─────────────────────────────────────────────────
    const HDR_H = 70;
    const hdrTop = doc.y;
    doc.rect(L, hdrTop, W, HDR_H).fill(C.dark);

    // Title, centred
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(15)
      .text(title.toUpperCase(), L, hdrTop + 10, { width: W, align: 'center' });

    // Meta line
    const meta = `${subject}   |   Grade: ${grade}   |   Time: ${time}   |   Total Marks: ${marks}`;
    doc
      .fillColor('#d1d5db')
      .font('Helvetica')
      .fontSize(9)
      .text(meta, L, hdrTop + 38, { width: W, align: 'center' });

    // Advance past the header
    doc.y = hdrTop + HDR_H + 12;

    // ── GENERAL INSTRUCTIONS ──────────────────────────────────────────────
    const instrItems = [
      'Read all questions carefully before answering.',
      'Write answers in the space provided.',
      'All questions are compulsory unless stated otherwise.',
      'Marks for each question are indicated in brackets.',
    ];
    const INSTR_PAD  = 8;
    const INSTR_LINE = 13;
    const INSTR_H    = INSTR_PAD + 14 + instrItems.length * INSTR_LINE + INSTR_PAD;
    const instrTop   = doc.y;

    drawBox(instrTop, INSTR_H, C.light);

    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8).text(
      'GENERAL INSTRUCTIONS', L + 10, instrTop + INSTR_PAD, { width: W - 20 }
    );

    instrItems.forEach((item, i) => {
      doc.fillColor(C.gray).font('Helvetica').fontSize(8).text(
        `\u2022  ${item}`,
        L + 10,
        instrTop + INSTR_PAD + 14 + i * INSTR_LINE,
        { width: W - 20, lineBreak: false }
      );
    });

    doc.y = instrTop + INSTR_H + 10;

    // ── STUDENT INFORMATION ───────────────────────────────────────────────
    const STU_H  = 72;
    const stuTop = doc.y;

    drawBox(stuTop, STU_H);

    doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8).text(
      'STUDENT INFORMATION', L + 10, stuTop + 8, { width: W - 20 }
    );

    // Name row
    const nameY = stuTop + 26;
    doc.fillColor(C.gray).font('Helvetica').fontSize(8.5).text('Name:', L + 10, nameY, { lineBreak: false });
    doc.moveTo(L + 50, nameY + 10).lineTo(L + W - 8, nameY + 10)
       .strokeColor('#9ca3af').lineWidth(0.4).stroke();

    // Roll / Section row
    const rowY   = stuTop + 48;
    const halfW  = (W - 28) / 2;
    doc.fillColor(C.gray).font('Helvetica').fontSize(8.5).text('Roll No:', L + 10, rowY, { lineBreak: false });
    doc.moveTo(L + 55, rowY + 10).lineTo(L + 10 + halfW, rowY + 10)
       .strokeColor('#9ca3af').lineWidth(0.4).stroke();

    doc.fillColor(C.gray).font('Helvetica').fontSize(8.5).text('Section:', L + 18 + halfW, rowY, { lineBreak: false });
    doc.moveTo(L + 18 + halfW + 52, rowY + 10).lineTo(L + W - 8, rowY + 10)
       .strokeColor('#9ca3af').lineWidth(0.4).stroke();

    doc.y = stuTop + STU_H + 14;

    // ── SECTIONS & QUESTIONS ──────────────────────────────────────────────
    let globalQ = 0;

    for (const [sIdx, section] of paper.sections.entries()) {
      // Section header
      ensureSpace(50);
      const secTop    = doc.y;
      const BADGE_SZ  = 24;

      // Badge square
      doc.rect(L, secTop, BADGE_SZ, BADGE_SZ).fill(C.dark);
      doc.fillColor(C.white).font('Helvetica-Bold').fontSize(11)
         .text(ALPHA[sIdx] || String(sIdx + 1), L, secTop + 5, { width: BADGE_SZ, align: 'center' });

      // Section title
      doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(11)
         .text(section.title, L + BADGE_SZ + 8, secTop + 2, { width: W - BADGE_SZ - 8 });

      if (section.instruction) {
        doc.fillColor(C.gray).font('Helvetica').fontSize(8.5)
           .text(section.instruction, L + BADGE_SZ + 8, doc.y + 2, { width: W - BADGE_SZ - 8 });
      }

      doc.y = Math.max(doc.y, secTop + BADGE_SZ) + 8;

      // Questions
      for (const q of section.questions) {
        globalQ += 1;
        const isMCQ = q.options && q.options.length > 0;
        const answerLines = isMCQ ? 0 : q.marks > 4 ? 6 : 3;

        // Estimate height for page-break check
        const optRows  = isMCQ ? Math.ceil(q.options.length / 2) : 0;
        const estH     = 32 + optRows * 16 + answerLines * 12;
        ensureSpace(estH);

        const qTop    = doc.y;
        const QBADGE  = 20;
        const TXT_W   = W - QBADGE - 8 - 46; // leave 46 for marks badge on right

        // Question number badge
        doc.rect(L, qTop, QBADGE, QBADGE).fillAndStroke('#f3f4f6', C.border);
        doc.fillColor(C.dark).font('Helvetica-Bold').fontSize(8.5)
           .text(String(globalQ), L, qTop + 5, { width: QBADGE, align: 'center' });

        // Question text
        const qTextX = L + QBADGE + 8;
        doc.fillColor(C.text).font('Helvetica').fontSize(9.5)
           .text(q.question, qTextX, qTop + 3, { width: TXT_W, lineBreak: true });

        // Marks badge (top-right)
        doc.fillColor(C.orange).font('Helvetica-Bold').fontSize(8)
           .text(`[${q.marks}M]`, L + W - 38, qTop + 3, { width: 38, align: 'right', lineBreak: false });

        // --- MCQ Options ---
        if (isMCQ) {
          doc.y = Math.max(doc.y, qTop + QBADGE) + 4;
          const OPT_START_Y = doc.y;   // ← fixed Y captured ONCE before the loop
          const COL_W       = (W - QBADGE - 8) / 2;
          const OPT_ROW_H   = 15;
          const OPT_X_BASE  = L + QBADGE + 8;

          q.options.forEach((opt, oIdx) => {
            const col  = oIdx % 2;
            const row  = Math.floor(oIdx / 2);
            const optX = OPT_X_BASE + col * COL_W;
            const optY = OPT_START_Y + row * OPT_ROW_H;
            const lbl  = `(${OPTION_LETTERS[oIdx]})`;

            // Label
            doc.fillColor(C.gray).font('Helvetica-Bold').fontSize(8.5)
               .text(lbl, optX, optY, { width: 22, lineBreak: false });

            // Option text — compute available width
            const textX = optX + 22;
            const avail = COL_W - 26;   // subtract label + small gap
            doc.fillColor(C.text).font('Helvetica').fontSize(8.5)
               .text(` ${opt}`, textX, optY, { width: avail, lineBreak: false });
          });

          // Advance doc.y past all option rows
          const totalRows = Math.ceil(q.options.length / 2);
          doc.y = OPT_START_Y + totalRows * OPT_ROW_H + 4;

        } else {
          // --- Answer lines for written questions ---
          doc.y = Math.max(doc.y, qTop + QBADGE) + 6;
          for (let li = 0; li < answerLines; li++) {
            const lineY = doc.y;
            doc.moveTo(L + QBADGE + 8, lineY)
               .lineTo(L + W, lineY)
               .strokeColor('#d1d5db')
               .lineWidth(0.4)
               .dash(5, { space: 4 })
               .stroke()
               .undash();
            doc.y = lineY + 12;
          }
        }

        doc.y += 8; // gap between questions
      }

      doc.y += 6; // gap after section
    }

    // ── FOOTER ─────────────────────────────────────────────────────────────
    ensureSpace(24);
    doc.moveTo(L, doc.y).lineTo(L + W, doc.y)
       .strokeColor(C.border).lineWidth(0.5).stroke();
    doc.y += 5;
    doc.fillColor(C.gray).font('Helvetica').fontSize(8)
       .text('*** End of Question Paper ***   |   Generated by VedaAI', L, doc.y, {
         width: W, align: 'center',
       });

    doc.end();
  } catch (err) {
    console.error('generatePDF error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
