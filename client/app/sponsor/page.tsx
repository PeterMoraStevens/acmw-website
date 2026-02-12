"use client";

import { useEffect, useState, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Trash2Icon,
  FileText,
  LogIn,
  LogOut,
  BookOpen,
  Megaphone,
  Mail,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResumeInfo = {
  fileName: string;
  uploadedAt: { seconds: number } | null;
  url: string;
  storagePath: string;
};

const Page = () => {
  const { data: session, status } = useSession();
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rawEmail = session?.user?.email ?? "";
  const userEmail = rawEmail.trim().toLowerCase();
  const isOsuEmail = userEmail.endsWith("@oregonstate.edu");

  useEffect(() => {
    if (status !== "authenticated" || !isOsuEmail) return;
    async function fetchResume() {
      setLoadingResume(true);
      try {
        const docRef = doc(db, "resumes", userEmail);

        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setResumeInfo(snap.data() as ResumeInfo);
        } else {
          setResumeInfo(null);
        }
      } catch (err) {
        console.error("Error fetching resume:", err);
      } finally {
        setLoadingResume(false);
      }
    }
    fetchResume();
  }, [status, isOsuEmail, userEmail]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const isPdf =
      file &&
      (file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"));
    if (file && !isPdf) {
      toast("Invalid file type", { description: "Please select a PDF file." });
      setSelectedFile(null);
      return;
    }
    if (file && file.size > 4 * 1024 * 1024) {
      toast("File too large", { description: "Maximum file size is 4 MB." });
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("resume", selectedFile);

      const res = await fetch("/api/uploadResume", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Upload failed");
      }

      const data = await res.json();
      toast("Resume uploaded successfully");

      setResumeInfo({
        fileName: data.fileName,
        uploadedAt: { seconds: Math.floor(Date.now() / 1000) },
        url: data.url,
        storagePath: "",
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast("Error uploading resume", { description: String(err) });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch("/api/deleteResume", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Delete failed");
      }
      toast("Resume deleted");
      setResumeInfo(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast("Error deleting resume", { description: String(err) });
    }
  };

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return "";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-18">
      <h1 className="text-3xl font-bold mb-6">Sponsor ACM-W</h1>

      <p className="text-muted-foreground mb-8">
        Partner with ACM-W at Oregon State University to connect with talented
        students in computing. Below are the ways your company can get involved.
      </p>

      {/* Sponsorship Info Cards */}
      <div className="flex flex-col gap-4 mb-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Resume Book
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Gain access to our resume book featuring students across all
              computing disciplines. Connect directly with candidates for
              internships, co-ops, and full-time positions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Branding &amp; Advertising
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Provide funding to have your company&apos;s name and logo
              displayed on our website and advertised during our meetings and
              events. Get your brand in front of our members throughout the
              year.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Get in Touch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground italic">
              Contact email coming soon.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resume Upload Section */}

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Upload Your Resume</h2>
          <p className="text-muted-foreground">
            Are you an OSU student? Sign in with your @oregonstate.edu Google
            account to upload your resume to our resume book.
          </p>
        </CardHeader>
        <CardContent className="">
          {status === "loading" && (
            <p className="text-muted-foreground">Loading...</p>
          )}

          {status === "unauthenticated" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-muted-foreground">
                Sign in to upload your resume.
              </p>
              <Button onClick={() => signIn("google")}>
                <LogIn className="mr-2 w-4 h-4" />
                Sign in with Google
              </Button>
            </div>
          )}

          {status === "authenticated" && !isOsuEmail && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-muted-foreground">
                Signed in as <span className="font-semibold">{userEmail}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Only @oregonstate.edu emails can upload resumes.
              </p>
              <Button variant="neutral" onClick={() => signOut()}>
                <LogOut className="mr-2 w-4 h-4" />
                Sign out
              </Button>
            </div>
          )}

          {status === "authenticated" && isOsuEmail && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Signed in as{" "}
                  <span className="font-semibold">{userEmail}</span>
                </p>
                <Button variant="neutral" size="sm" onClick={() => signOut()}>
                  <LogOut className="mr-1 w-3 h-3" />
                  Sign out
                </Button>
              </div>

              {loadingResume ? (
                <p className="text-muted-foreground">
                  Checking for existing resume...
                </p>
              ) : resumeInfo ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-secondary-background">
                    <FileText className="w-5 h-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {resumeInfo.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatDate(resumeInfo.uploadedAt)}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" className="bg-red-500 shrink-0">
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete resume?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove your resume from the
                            resume book.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      Replace your resume:
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="grid w-full max-w-64 items-center gap-1.5">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          id="picture"
                          onChange={handleFileChange}
                          className="text-sm"
                        />
                      </div>

                      <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                      >
                        <Upload className="mr-1 w-4 h-4" />
                        {uploading ? "Uploading..." : "Replace"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="grid w-full max-w-64 items-center gap-1.5">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      id="picture"
                      onChange={handleFileChange}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                  >
                    <Upload className="mr-1 w-4 h-4" />
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
