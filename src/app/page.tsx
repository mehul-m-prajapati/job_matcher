"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    matchScore: number;
    missingKeywords: string[];
    explanation: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!resumeFile || !jobDesc) {
      alert("Please upload a resume and enter a job description.");
      return;
    }
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDesc", jobDesc);

    try {
      const resp = await fetch("/api/resumeMatch", {
        method: "POST",
        body: formData,
      });

      if (resp.ok) {
        const data = await resp.json();
        setResult(data);
      } else {
        alert("Error matching resume.");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8 text-center">
        Job Description Matcher
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Resume Upload */}
        <div className="max-w-sm">
          <Label htmlFor="resume" className="mb-2 block text-lg font-semibold">
            Upload Resume (PDF)
          </Label>
          <Input
            id="resume"
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files) setResumeFile(e.target.files[0]);
            }}
            className="cursor-pointer"
          />
          {resumeFile && (
            <p className="mt-2 text-sm text-gray-600">Selected: {resumeFile.name}</p>
          )}
        </div>

        {/* Job Description */}
        <div>
          <Label htmlFor="jobDesc" className="mb-2 block text-lg font-semibold">
            Job Description
          </Label>
          <Textarea
            id="jobDesc"
            rows={8}
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste the job description here..."
            className="font-mono"
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={loading} className="">
          {loading ? "Matching..." : "Match Resume"}
        </Button>
      </form>

      {/* Result */}
      {result && (
        <section className="mt-12 rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="mb-4 text-2xl font-bold">Match Result</h2>

          <p className="mb-3 text-lg">
            <span className="font-semibold">Match Score:</span> {result.matchScore}%
          </p>

          <hr className="bg-gray-50"></hr>

          <div className="m-4">
            <h3 className="mb-1 font-semibold text-lg">Missing Keywords/Skills:</h3>
            {result.missingKeywords.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 columns-2 gap-4">
                    {result.missingKeywords.map((keyword, idx) => (
                        <li key={idx}>{keyword}</li>
                    ))}
                </ul>
            ) : (
              <p className="text-green-700 font-semibold">None! Great match.</p>
            )}
          </div>

          <hr className="bg-gray-50"></hr>

          <div className="m-4">
            <h3 className="mb-1 font-semibold text-lg">Summary:</h3>
            <p className="italic">{result.explanation}</p>
          </div>

        </section>
      )}
    </main>
  );
}
