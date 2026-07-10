import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";

export const generateCoverLetter = async (req, res) => {
  try {
    const { fullName, jobRole, companyName, jobDescription } = req.body

    if (!fullName || !jobRole || !companyName) {
      return res.status(400).json({ message: "Full Name, Job Role and Company Name are required." })
    }

    let resumeText = "";

    if (req.file) {
      const filepath = req.file.path
      const fileBuffer = await fs.promises.readFile(filepath)
      const uint8Array = new Uint8Array(fileBuffer)
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        resumeText += pageText + "\n";
      }

      resumeText = resumeText.replace(/\s+/g, " ").trim();
      fs.unlinkSync(filepath)
    }

    const messages = [
      {
        role: "system",
        content: `
You are a professional cover letter writer.

Write a compelling, personalized cover letter based on the candidate's details.

Rules:
- Use a professional but warm tone
- Keep it to 2-3 short paragraphs maximum
- Each paragraph maximum 3 sentences only
- Keep it concise and to the point
- Mention the company name and role specifically
- Highlight relevant skills and experience from resume if provided
- End with a confident closing statement
- Do NOT use placeholders like [Your Name] or [Date]
- Start directly with "Dear Hiring Manager,"
- Sign off with the candidate's actual name
`
      },
      {
        role: "user",
        content: `
Full Name: ${fullName}
Job Role: ${jobRole}
Company Name: ${companyName}
Job Description: ${jobDescription || "Not provided"}
Resume: ${resumeText || "Not provided"}
`
      }
    ];

    const aiResponse = await askAi(messages);

    return res.status(200).json({
      coverLetter: aiResponse
    });

  } catch (error) {
    return res.status(500).json({ message: `Cover letter error: ${error}` })
  }
}