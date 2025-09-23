"use client";

import { useState } from "react";


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
        }
        else {
            alert("Error matching resume.");
        }
    }
    catch (error) {
        console.log(error);
    }
    finally {
        setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">AI-Powered Job Description Matcher</h1>

        <form onSubmit={handleSubmit} className="space-y-6">

            <div>
                <label className="block mb-2 font-semibold">Upload Resume (PDF):</label>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                        if (e.target.files)
                            setResumeFile(e.target.files[0]);
                    }}
                    className="border p-2 w-full"
                />
            </div>

            <div>
                <label className="block mb-2 font-semibold">Job Description:</label>
                <textarea
                    rows={8}
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    className="border p-2 w-full font-mono"
                    placeholder="Paste the job description here..."
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50"
            >
                {loading ? "Matching..." : "Match Resume"}
            </button>
        </form>

        {result && (
            <section className="mt-8 bg-gray-200 text-gray-700 p-6 rounded shadow">
                <h2 className="text-xl font-bold mb-4">Match Result</h2>

                <p>
                    <strong>Match Score:</strong> {result.matchScore}%
                </p>

                <p className="mt-2">
                    <strong>Missing Keywords/Skills:</strong>{" "}
                    {result.missingKeywords.length > 0 ?
                        result.missingKeywords.join(", ") : "None! Great match."}
                </p>

                <p className="mt-2 italic">{result.explanation}</p>
            </section>
        )}
    </main>
  );
}
