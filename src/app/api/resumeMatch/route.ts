import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import PDFParser from "pdf2json";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err: any) => reject(err));
    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      // pdfData form has Pages -> Texts arrays
      let fullText = "";

      for (const page of pdfData.Pages) {
        for (const textItem of page.Texts) {
          // Decode percent-encoded text and join
          fullText += decodeURIComponent(textItem.R[0].T) + " ";
        }
        fullText += "\n";
      }

      resolve(fullText.trim());
    });

    pdfParser.parseBuffer(buffer);
  });
}

function cleanMarkdownJson(responseText: string): string | null {

  // Match ```json ... ``` block (including newlines)
  const mdCodeBlockRegex = /```json\s*([\s\S]*?)```/i;

  const match = responseText.match(mdCodeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // If no markdown block, fallback to extracting between { and }
  const firstIndex = responseText.indexOf("{");
  const lastIndex = responseText.lastIndexOf("}");

  if (firstIndex !== -1 && lastIndex !== -1 && lastIndex > firstIndex) {
    return responseText.substring(firstIndex, lastIndex + 1);
  }

  return null;
}

async function callGeminiAI(resumeText: string, jobDesc: string) {

  const prompt = `You are an AI resume matcher.

Given the resume and job description below, evaluate how well the resume matches the job. Provide:
1. A match score (0-100%)
2. A list of missing or underrepresented keywords/skills as a JSON array
3. A brief explanation

Resume:
${resumeText}

Job Description:
${jobDesc}

Respond with ONLY JSON like this:
{
"matchScore": number,
"missingKeywords": [string],
"explanation": string
}`;

  const resp = await openai.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
    max_tokens: 800,
  });

  const responseText = resp.choices[0].message?.content || "{}";

  const jsonString = cleanMarkdownJson(responseText);

  if (!jsonString) {
    return {
        matchScore: 0,
        missingKeywords: [],
        explanation: "No JSON found in AI response.",
    };
  }

  try {
    const result = JSON.parse(jsonString);
    return result;
  }
  catch {
    return {
        matchScore: 0,
        missingKeywords: [],
        explanation: "Failed to parse AI response.",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Use Web API FormData to parse multipart form data
    const formData = await req.formData();

    const jobDesc = formData.get("jobDesc")?.toString() || "";
    const resumeFile = formData.get("resume");

    if (!resumeFile || !(resumeFile instanceof File)) {
      return NextResponse.json({ message: "No resume uploaded" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await resumeFile.arrayBuffer();
    const resumeBuffer = Buffer.from(arrayBuffer);

    // Extract text using pdf2json
    const resumeText = await extractTextFromPdf(resumeBuffer);

    // Call Gemini AI
    const aiResult = await callGeminiAI(resumeText, jobDesc);

    return NextResponse.json(aiResult);
  }
  catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
