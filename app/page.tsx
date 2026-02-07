"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Search, Calendar, MessageSquare, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const features = [
  {
    icon: Search,
    title: "Smart Discovery",
    description: "Find students with the exact skills you need using powerful filters and search.",
  },
  {
    icon: Users,
    title: "Team Building",
    description: "Express interest in potential teammates and form balanced project teams.",
  },
  {
    icon: Calendar,
    title: "Availability Matching",
    description: "See when others are free to collaborate and find compatible schedules.",
  },
  {
    icon: MessageSquare,
    title: "Direct Connection",
    description: "Reach out to matched students and start collaborating right away.",
  },
];

const steps = [
  { step: "1", title: "Create Profile", description: "Add your skills, interests, and availability" },
  { step: "2", title: "Browse Students", description: "Find teammates with complementary skills" },
  { step: "3", title: "Express Interest", description: "Send interest requests to potential teammates" },
  { step: "4", title: "Form Teams", description: "Match up and start building together" },
];

export default function LandingPage() {
  const [stats, setStats] = useState({ studentsLooking: 0, teamsFormed: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Use API route to bypass RLS and get accurate counts
        const response = await fetch("/api/stats");
        const data = await response.json();

        if (data.success) {
          setStats({
            studentsLooking: data.studentsLooking || 0,
            teamsFormed: data.teamsFormed || 0,
          });
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoadingStats(false);
      }
    }

    loadStats();

    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(loadStats, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center">
              <Image src="/favicon.png" alt="HuskyTeams" width={36} height={36} className="object-contain" />
            </div>
            <span className="text-xl font-semibold text-foreground">HuskyTeams</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Find Your Perfect
            <span className="text-primary"> Project Team</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base font-medium text-primary">
            CS5130 40157 AppldProg&DataPrcssngforAI SEC 02 Spring 2026
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Connect with fellow Northeastern students who have the skills you need. Build amazing
            projects together with teammates who match your schedule and interests.
          </p>

          {/* Stats */}
          {!loadingStats && (
            <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-8 rounded-lg border border-border bg-card p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.studentsLooking}</div>
                <div className="text-sm text-muted-foreground">Students Looking</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.teamsFormed}</div>
                <div className="text-sm text-muted-foreground">Teams Formed</div>
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Finding Teammates
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-border bg-card px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Everything you need to build your dream team
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Our platform makes it easy to find, connect with, and collaborate with other students.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border bg-background">
                <CardContent className="pt-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">How it works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Get matched with the right teammates in just a few simple steps.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-border bg-card px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                Built for Northeastern students, by Northeastern students
              </h2>
              <p className="mt-4 text-muted-foreground">
                We understand the unique challenges of finding project partners at a large
                university. HuskyTeams makes it simple to connect with like-minded classmates.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Filter by specific technical skills",
                  "See availability at a glance",
                  "Find students in your major or classes",
                  "Build balanced, effective teams",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-background p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20" />
                  <div className="flex-1">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="mt-2 h-3 w-32 rounded bg-muted" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    React
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Python
                  </span>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    UI/UX
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-6 rounded ${i % 3 === 0 ? "bg-primary/30" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to find your team?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join hundreds of Northeastern students already using HuskyTeams to build amazing
            projects together.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Create Your Profile
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center">
                <Image src="/favicon.png" alt="HuskyTeams" width={32} height={32} className="object-contain" />
              </div>
              <span className="font-semibold text-foreground">HuskyTeams</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Made with care for Northeastern students
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
