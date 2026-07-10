import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";

export const findJobs = async (req, res) => {
    try {
        const { workType, jobType, targetCompany, experience } = req.body

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
You are a career advisor AI.

Based on the candidate's resume, extract their job role, experience level and suggest exactly 5 relevant job titles.

Also map experience to level:
0-1 year → Entry Level
1-3 years → Mid Level  
3-6 years → Senior
6+ years → Lead

Return ONLY valid JSON:
{
  "role": "main job role",
  "experience": "X years",
  "level": "Mid Level",
  "suggestions": ["Job Title 1", "Job Title 2", "Job Title 3", "Job Title 4", "Job Title 5"]
}
`
            },
            {
                role: "user",
                content: resumeText || "No resume provided. Suggest general software developer jobs."
            }
        ];

        const aiResponse = await askAi(messages);
        const cleaned = aiResponse.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // const level = parsed.level || "Mid Level";
        const level = experience
            ? experience == 0 ? "Entry Level"
                : experience <= 3 ? "Mid Level"
                    : experience <= 6 ? "Senior"
                        : "Lead"
            : parsed.level || "Mid Level";

        const workTypeText = workType === "remote" ? "Remote" : workType === "onsite" ? "Onsite" : "";
        const jobTypeText = jobType === "fulltime" ? "Full Time" : jobType === "parttime" ? "Part Time" : "";
        const company = targetCompany?.trim() || "";

        const jobSuggestions = parsed.suggestions.map((title) => {
            const query = [level, title, workTypeText, jobTypeText, company]
                .filter(Boolean)
                .join(" ");

            const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`;
            const naukriUrl = `https://www.naukri.com/${title.toLowerCase().replace(/\s+/g, "-")}-jobs?jobExperience=${parsed.experience}`;

            return {
                title,
                linkedinUrl,
                naukriUrl
            }
        });

        return res.status(200).json({
            role: parsed.role,
            experience: experience ? `${experience} years` : parsed.experience,
            level,
            jobSuggestions
        });

    } catch (error) {
        return res.status(500).json({ message: `Job finder error: ${error}` })
    }
}