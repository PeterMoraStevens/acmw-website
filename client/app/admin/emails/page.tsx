"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusSquare, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/allowedEmails")
      .then((res) => res.json())
      .then((data) => setEmails(data.emails ?? []))
      .catch(() => toast.error("Failed to load admin emails"))
      .finally(() => setLoading(false));
  }, []);

  const addEmail = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    try {
      const res = await fetch("/api/allowedEmails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message ?? "Failed to add email");
        return;
      }

      setEmails((prev) => [...prev, email]);
      setNewEmail("");
      toast.success("Email added");
    } catch {
      toast.error("Failed to add email");
    }
  };

  const removeEmail = async (email: string) => {
    try {
      const res = await fetch("/api/allowedEmails", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message ?? "Failed to remove email");
        return;
      }

      setEmails((prev) => prev.filter((e) => e !== email));
      toast.success("Email removed");
    } catch {
      toast.error("Failed to remove email");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 mt-16">
      <Card>
        <CardHeader>
          <CardTitle>Admin Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Manage who has access to admin pages. Changes take effect on their
            next sign-in.
          </p>

          <div className="flex gap-2 mb-6">
            <Input
              type="email"
              placeholder="email@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEmail()}
            />
            <Button onClick={addEmail}>
              <PlusSquare className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No admin emails configured.
            </p>
          ) : (
            <ul className="space-y-2">
              {emails.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between rounded-md border px-4 py-2"
                >
                  <span className="text-sm">{email}</span>
                  <Button
                    variant="neutral"
                    size="icon"
                    onClick={() => removeEmail(email)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
