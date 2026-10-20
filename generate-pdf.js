const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const puppeteer = require('puppeteer');

async function generatePDF() {
  const mdPath = path.join(__dirname, 'CV.md');
  const cssPath = path.join(__dirname, 'style.css');
  const htmlOutputPath = path.join(__dirname, 'CV.html');
  const pdfOutputPath = path.join(__dirname, 'Zachary_Powell_CV.pdf');
  const readmePath = path.join(__dirname, 'README.md');

  console.log('Reading CV.md and style.css...');
  const markdown = fs.readFileSync(mdPath, 'utf-8');
  const css = fs.readFileSync(cssPath, 'utf-8');

  // Generate README.md with repository badges, quick download link, and the CV content
  const readmeContent = `# Zachary Powell — Curriculum Vitae

[![Generate PDF CV](https://github.com/devwithzachary/CV/actions/workflows/generate-pdf.yml/badge.svg)](https://github.com/devwithzachary/CV/actions/workflows/generate-pdf.yml)
[![Download PDF](https://img.shields.io/badge/Download-PDF_CV-0284c7?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](./Zachary_Powell_CV.pdf)

> 📄 **[Download the latest PDF version of this CV](./Zachary_Powell_CV.pdf)**  
> 🌐 **[Visit devwithzachary.com](https://devwithzachary.com)**

---

${markdown}

---

## Tooling & PDF Generation

This repository uses [Node.js](https://nodejs.org/), [Marked](https://marked.js.org/), and [Puppeteer](https://pptr.dev/) to render \`CV.md\` into a pixel-perfect, 2-page print-optimized PDF with custom CSS typography.

### Generate locally

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Build PDF and HTML
npm run build
\`\`\`

### Automated GitHub Actions

Every push to the \`main\` branch automatically builds the latest PDF via GitHub Actions and commits the updated \`Zachary_Powell_CV.pdf\` back to the repository.
`;
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Updated README.md: ${readmePath}`);

  // Configure marked renderer
  let contentHtml = marked.parse(markdown);

  // Group <h3> sections into <div class="job-entry"> so page breaks don't split jobs awkwardly
  contentHtml = contentHtml.replace(/(<h3>[\s\S]*?)(?=(?:<h3>|<h2>|<hr|<\/div>|$))/g, '<div class="job-entry">$1</div>');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zachary Powell - CV</title>
  <style>
${css}
  </style>
</head>
<body>
  <div class="cv-container">
    ${contentHtml}
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlOutputPath, fullHtml);
  console.log(`Saved HTML preview to: ${htmlOutputPath}`);

  console.log('Launching Puppeteer to generate PDF...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none']
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, {
    waitUntil: ['load', 'networkidle0']
  });

  // Evaluate font load completion
  await page.evaluateHandle('document.fonts.ready');

  await page.pdf({
    path: pdfOutputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '11mm',
      right: '13mm',
      bottom: '11mm',
      left: '13mm'
    }
  });

  await browser.close();
  console.log(`\n Successfully generated PDF: ${pdfOutputPath}`);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
