import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/openRouter.service.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }
    const filepath = req.file.path

    const fileBuffer = await fs.promises.readFile(filepath)
    const uint8Array = new Uint8Array(fileBuffer)

    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let resumeText = "";

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const pageText = content.items.map(item => item.str).join(" ");
      resumeText += pageText + "\n";
    }


    resumeText = resumeText
      .replace(/\s+/g, " ")
      .trim();

    const messages = [
      {
        role: "system",
        content: `
Extract structured data from resume and evaluate it.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"],
  "resumeQuality": "Good" or "Moderate" or "Needs Improvement",
  "resumeFeedback": "2-3 lines of honest feedback about the resume"
}
`
      },
      {
        role: "user",
        content: resumeText
      }
    ];


    const aiResponse = await askAi(messages)

    const cleanedResponse = aiResponse.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanedResponse);

    fs.unlinkSync(filepath)


    res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      resumeQuality: parsed.resumeQuality,
      resumeFeedback: parsed.resumeFeedback,
      resumeText
    });

  } catch (error) {
    console.error(error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ message: error.message });
  }
};


export const generateQuestion = async (req, res) => {
  try {
    let { role, experience, mode, resumeText, projects, skills, companyName, jobDescription } = req.body

    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();

    if (!role || !experience || !mode) {
      return res.status(400).json({ message: "Role, Experience and Mode are required." })
    }

    const user = await User.findById(req.userId)

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    if (user.credits < 50) {
      return res.status(400).json({
        message: "Not enough credits. Minimum 50 required."
      });
    }

    const projectText = Array.isArray(projects) && projects.length
      ? projects.join(", ")
      : "None";

    const skillsText = Array.isArray(skills) && skills.length
      ? skills.join(", ")
      : "None";


    const safeResume = resumeText?.trim() || "None";
    const safeCompany = companyName?.trim() || "None";
    const safeJD = jobDescription?.trim() || "None";


    // Validate role and company
    const validationMessages = [
      {
        role: "system",
        content: `You are a validation assistant. 
Check if the given job role and company name are real and legitimate.

Return ONLY valid JSON:
{
  "isValid": true or false,
  "reason": "short reason if invalid"
}`
      },
      {
        role: "user",
        content: `Job Role: ${role}
Company Name: ${safeCompany}`
      }
    ];

    const validationResponse = await askAi(validationMessages);
    const cleanedValidation = validationResponse.replace(/```json|```/g, "").trim();
    const validation = JSON.parse(cleanedValidation);

    if (!validation.isValid) {
      return res.status(400).json({
        message: `Invalid details: ${validation.reason}`
      });
    }


    const userPrompt = `
    Role:${role}
    Experience:${experience}
    InterviewMode:${mode}
    Company:${safeCompany}
    JobDescription:${safeJD}
    Projects:${projectText}
    Skills:${skillsText},
    Resume:${safeResume}
    `;

    if (!userPrompt.trim()) {
      return res.status(400).json({
        message: "Prompt content is empty."
      });
    }

    //     const messages = [

    //       {
    //         role: "system",
    //         content: `
    // You are a real human interviewer ${safeCompany != "None" ? `at ${safeCompany}` : "at a top company"} conducting a professional ${mode} interview.

    // ${mode === "Technical" && safeJD !== "None" ? `The candidate has mentioned a strong topic they want to be tested on: ${safeJD}. Use this ONLY for Question 3. Do NOT base other questions on this topic.` : mode === "HR" ? "" : safeJD !== "None" ? `The candidate applied for this role. Job Description: ${safeJD}` : ""}

    // Speak in simple, natural English as if you are directly talking to the candidate.

    // Generate exactly 5 interview questions.

    // Strict Rules:
    // - Each question must contain between 15 and 25 words.
    // - Each question must be a single complete sentence.
    // - Do NOT number them.
    // - Do NOT add explanations.
    // - Do NOT add extra text before or after.
    // - One question per line only.
    // - Keep language simple and conversational.
    // - Questions must feel practical and realistic.

    // Difficulty progression:
    // Question 1 → easy, general warm up question
    // Question 2 → ${mode === "HR" ? `medium, MUST be about company culture, values, or general knowledge about ${safeCompany !== "None" ? safeCompany : "the company"}. Example topics: why do you want to join us, what do you know about our culture, our mission, or our work environment` : "medium, based on candidate skills and projects"}  
    // Question 3 → ${mode === "Technical" ? `medium, MUST be a single theoretical concept question based on ${safeJD !== "None" ? `the topic: ${safeJD}` : "any strong topic found in the candidate resume"}. Ask about a specific concept, definition, or difference within that topic. Keep it theoretical only, not practical.` : "medium, role specific and practical"}
    // Question 4 → medium, MUST be very specific to ${safeCompany !== "None" ? safeCompany : "the company"} — mention ${safeCompany !== "None" ? safeCompany : "the company"} by name, ask about their specific products, culture, scale, or engineering challenges  
    // Question 5 → hard, deep technical or situational question at ${safeCompany !== "None" ? safeCompany : "company"} level difficulty

    // Make questions based on the candidate's role, experience, projects, skills, and resume details. Use strong topic ONLY for Question 3. Use company context ONLY for Question 4.
    // `
    //       }
    //       ,
    //       {
    //         role: "user",
    //         content: userPrompt
    //       }
    //     ];



    const hasResume = safeResume !== "None";
    const hasStrongTopic = mode === "Technical" && safeJD !== "None";

    const technicalContext = hasResume && hasStrongTopic
      ? `The candidate has provided their resume. Base most questions on their resume, projects, and skills. Question 3 ONLY should be based on their strong topic: ${safeJD}.`
      : hasResume && !hasStrongTopic
        ? `The candidate has provided their resume. Base all questions on their resume, projects, skills, and role.`
        : !hasResume && hasStrongTopic
          ? `The candidate has not provided a resume. Base questions on their strong topic: ${safeJD} and their role.`
          : `The candidate has not provided a resume or strong topic. Base all questions on their role and experience.`;

    const messages = [
      {
        role: "system",
        content: `
You are a real human interviewer ${safeCompany !== "None" ? `at ${safeCompany}` : "at a top company"} conducting a professional ${mode} interview.

${mode === "Technical" ? technicalContext : ""}

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 → easy, general warm up question based on ${hasResume ? "resume and role" : "role and experience"}
Question 2 → ${mode === "HR" ? `medium, MUST be about company culture, values, or general knowledge about ${safeCompany !== "None" ? safeCompany : "the company"}. Example topics: why do you want to join us, what do you know about our culture, our mission, or our work environment` : `medium, based on ${hasResume ? "candidate projects and skills from resume" : "role and experience"}`}
Question 3 → ${mode === "Technical" ? `medium, MUST be a single theoretical concept question based on ${hasStrongTopic ? `the strong topic: ${safeJD}` : hasResume ? "any strong topic found in the candidate resume" : "any core concept related to the role"}. Ask about a specific concept, definition, or difference. Keep it theoretical only, not practical.` : "medium, role specific and practical"}
Question 4 → hard, MUST be very specific to ${safeCompany !== "None" ? safeCompany : "the company"} — mention ${safeCompany !== "None" ? safeCompany : "the company"} by name, ask about their specific products, culture, scale, or engineering challenges
Question 5 → hardest, deep technical or situational question at ${safeCompany !== "None" ? safeCompany : "company"} level difficulty

IMPORTANT: 
- Question 3 is the ONLY question that uses strong topic.
- Questions 1, 2, 5 must be based on resume/role — NOT the strong topic.
- Question 4 must be company specific only.
`
      },
      {
        role: "user",
        content: userPrompt
      }
    ];


    const aiResponse = await askAi(messages)

    if (!aiResponse || !aiResponse.trim()) {

      return res.status(500).json({
        message: "AI returned empty response."
      });

    }

    const questionsArray = aiResponse
      .split("\n")
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .slice(0, 5);

    if (questionsArray.length === 0) {

      return res.status(500).json({
        message: "AI failed to generate questions."
      });
    }

    user.credits -= 50;
    await user.save();

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionsArray.map((q, index) => ({
        question: q,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: [60, 60, 90, 90, 120][index],
      }))
    })

    res.json({
      interviewId: interview._id,
      creditsLeft: user.credits,
      userName: user.name,
      questions: interview.questions
    });
  } catch (error) {
    return res.status(500).json({ message: `failed to create interview ${error}` })
  }
}


export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timeTaken } = req.body

    const interview = await Interview.findById(interviewId)
    const question = interview.questions[questionIndex]

    // If no answer
    if (!answer) {
      question.score = 0;
      question.feedback = "You did not submit an answer.";
      question.answer = "";

      await interview.save();

      return res.json({
        feedback: question.feedback
      });
    }

    // If time exceeded
    if (timeTaken > question.timeLimit) {
      question.score = 0;
      question.feedback = "Time limit exceeded. Answer not evaluated.";
      question.answer = answer;

      await interview.save();

      return res.json({
        feedback: question.feedback
      });
    }


    const messages = [
      {
        role: "system",
        content: `
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence – Does the answer sound clear, confident, and well-presented?
2. Communication – Is the language simple, clear, and easy to understand?
3. Correctness – Is the answer accurate, relevant, and complete?

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
`
      }
      ,
      {
        role: "user",
        content: `
Question: ${question.question}
Answer: ${answer}
`
      }
    ];


    const aiResponse = await askAi(messages)


    const parsed = JSON.parse(aiResponse);

    question.answer = answer;
    question.confidence = parsed.confidence;
    question.communication = parsed.communication;
    question.correctness = parsed.correctness;
    question.score = parsed.finalScore;
    question.feedback = parsed.feedback;
    await interview.save();


    return res.status(200).json({ feedback: parsed.feedback })
  } catch (error) {
    return res.status(500).json({ message: `failed to submit answer ${error}` })

  }
}


export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body
    const interview = await Interview.findById(interviewId)
    if (!interview) {
      return res.status(400).json({ message: "failed to find Interview" })
    }

    const totalQuestions = interview.questions.length;

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestions
      ? totalScore / totalQuestions
      : 0;

    const avgConfidence = totalQuestions
      ? totalConfidence / totalQuestions
      : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    interview.finalScore = finalScore;
    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
      })),
    })
  } catch (error) {
    return res.status(500).json({ message: `failed to finish Interview ${error}` })
  }
}


export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");

    return res.status(200).json(interviews)

  } catch (error) {
    return res.status(500).json({ message: `failed to find currentUser Interview ${error}` })
  }
}

export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }


    const totalQuestions = interview.questions.length;

    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });
    const avgConfidence = totalQuestions
      ? totalConfidence / totalQuestions
      : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    return res.json({
      finalScore: interview.finalScore,
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions
    });

  } catch (error) {
    return res.status(500).json({ message: `failed to find currentUser Interview report ${error}` })
  }
}




