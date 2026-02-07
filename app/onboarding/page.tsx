"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Loader2, ChevronRight, ChevronLeft, Check, X } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  category: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_MAP: Record<string, string> = {
  "Mon": "monday",
  "Tue": "tuesday",
  "Wed": "wednesday",
  "Thu": "thursday",
  "Fri": "friday",
  "Sat": "saturday",
  "Sun": "sunday"
};
const TIME_SLOTS = ["Morning", "Afternoon", "Evening"];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    major: "",
    graduationYear: "",
    bio: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [projectInterests, setProjectInterests] = useState<string[]>([]);
  const [teamSizePreference, setTeamSizePreference] = useState<number>(3);
  const [contactPreference, setContactPreference] = useState<string>("email");
  const [contactHandle, setContactHandle] = useState<string>("");
  const [status, setStatus] = useState<string>("looking");

  useEffect(() => {
    async function init() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Check if profile already completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, onboarding_complete")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed || profile?.onboarding_complete) {
        router.push("/dashboard");
        return;
      }

      // Fetch skills
      const { data: skillsData, error: skillsError } = await supabase
        .from("skills")
        .select("*")
        .order("category");

      if (skillsError) {
        console.error("Error fetching skills:", skillsError);
      }

      if (skillsData) {
        setSkills(skillsData);
      }

      setInitialLoading(false);
    }

    init();
  }, [router]);

  const MAX_SKILLS = 5;

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) => {
      // If already selected, remove it
      if (prev.includes(skillId)) {
        return prev.filter((s) => s !== skillId);
      }
      // If at limit, don't add
      if (prev.length >= MAX_SKILLS) {
        return prev;
      }
      // Add skill
      return [...prev, skillId];
    });
  };

  const toggleLookingFor = (skillId: string) => {
    setLookingFor((prev) => {
      // If already selected, remove it
      if (prev.includes(skillId)) {
        return prev.filter((s) => s !== skillId);
      }
      // If at limit, don't add
      if (prev.length >= MAX_SKILLS) {
        return prev;
      }
      // Add skill
      return [...prev, skillId];
    });
  };

  const toggleAvailability = (day: string, timeSlot: string) => {
    const key = `${day}-${timeSlot}`;
    setAvailability((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    if (!userId) return;
    setLoading(true);

    const supabase = createClient();

    // Upsert profile (create if doesn't exist, update if it does)
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        name: formData.name,
        full_name: formData.name, // Also set full_name for compatibility
        major: formData.major,
        graduation_year: formData.graduationYear ? parseInt(formData.graduationYear) : null,
        bio: formData.bio,
        linkedin_url: formData.linkedinUrl || null,
        github_url: formData.githubUrl || null,
        portfolio_url: formData.portfolioUrl || null,
        team_size_preference: teamSizePreference,
        contact_preference: contactPreference,
        contact_handle: contactHandle || null,
        status: status,
        onboarding_completed: true,
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error("Profile update error:", profileError);
      alert(`Error updating profile: ${profileError.message || JSON.stringify(profileError)}`);
      setLoading(false);
      return;
    }

    // Insert skills
    if (selectedSkills.length > 0) {
      const skillInserts = selectedSkills.map((skillId) => ({
        profile_id: userId,
        skill_id: skillId,
      }));
      const { error: skillsError } = await supabase.from("profile_skills").insert(skillInserts);
      if (skillsError) {
        console.error("Skills insert error:", skillsError);
        alert(`Error saving skills: ${skillsError.message}`);
        setLoading(false);
        return;
      }
    }

    // Insert looking for skills
    if (lookingFor.length > 0) {
      const lookingForInserts = lookingFor.map((skillId) => ({
        profile_id: userId,
        skill_id: skillId,
      }));
      const { error: lookingForError } = await supabase.from("profile_looking_for").insert(lookingForInserts);
      if (lookingForError) {
        console.error("Looking for skills insert error:", lookingForError);
        alert(`Error saving skills you're looking for: ${lookingForError.message}`);
        setLoading(false);
        return;
      }
    }

    // Insert availability
    const availabilityInserts = Object.entries(availability)
      .filter(([, isAvailable]) => isAvailable)
      .map(([key]) => {
        const [dayOfWeek, timeSlot] = key.split("-");
        return {
          profile_id: userId,
          day_of_week: DAYS_MAP[dayOfWeek] || dayOfWeek.toLowerCase(),
          time_of_day: timeSlot.toLowerCase(),
        };
      });

    if (availabilityInserts.length > 0) {
      const { error: availabilityError } = await supabase.from("availability").insert(availabilityInserts);
      if (availabilityError) {
        console.error("Availability insert error:", availabilityError);
        alert(`Error saving availability: ${availabilityError.message}`);
        setLoading(false);
        return;
      }
    }

    // Insert project interests
    if (projectInterests.length > 0) {
      const interestInserts = projectInterests.map((interest) => ({
        profile_id: userId,
        interest: interest.trim(),
      }));
      const { error: interestsError } = await supabase.from("project_interests").insert(interestInserts);
      if (interestsError) {
        console.error("Project interests insert error:", interestsError);
        alert(`Error saving project interests: ${interestsError.message}`);
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
  };

  const skillsByCategory = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>
  );

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center">
              <Image src="/favicon.png" alt="HuskyTeams" width={40} height={40} className="object-contain" />
            </div>
            <span className="text-2xl font-semibold text-foreground">HuskyTeams</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="mt-2 text-muted-foreground">
            Help teammates find you by adding your information
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="major">Major *</Label>
                  <Input
                    id="major"
                    placeholder="e.g., Computer Science"
                    value={formData.major}
                    onChange={(e) => setFormData((prev) => ({ ...prev, major: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    placeholder="e.g., 2026"
                    value={formData.graduationYear}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, graduationYear: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Project Pitch</Label>
                <Textarea
                  id="bio"
                  placeholder="I want to build X... Tell potential teammates about yourself, your project ideas, and what kind of projects you're excited about..."
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL (optional)</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={formData.linkedinUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, linkedinUrl: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub URL (optional)</Label>
                <Input
                  id="github"
                  placeholder="https://github.com/username"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, githubUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio URL (optional)</Label>
                <Input
                  id="portfolio"
                  placeholder="https://yourportfolio.com"
                  value={formData.portfolioUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, portfolioUrl: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size Preference *</Label>
                  <Select value={teamSizePreference.toString()} onValueChange={(v) => setTeamSizePreference(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 members</SelectItem>
                      <SelectItem value="3">3 members</SelectItem>
                      <SelectItem value="4">4 members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="looking">Looking for team</SelectItem>
                      <SelectItem value="open_to_offers">Open to offers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPreference">Preferred Contact Method *</Label>
                  <Select value={contactPreference} onValueChange={setContactPreference}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactHandle">Contact Handle</Label>
                  <Input
                    id="contactHandle"
                    placeholder={contactPreference === "email" ? "your.email@northeastern.edu" : contactPreference === "discord" ? "username#1234" : "@username"}
                    value={contactHandle}
                    onChange={(e) => setContactHandle(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Your Skills */}
        {step === 2 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Your Skills</CardTitle>
              <CardDescription>
                Select up to {MAX_SKILLS} skills you have. This helps others find you when they need your
                expertise.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {skills.length === 0 ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">
                    No skills available. Please contact support or check if skills have been seeded in the database.
                  </p>
                </div>
              ) : Object.keys(skillsByCategory).length === 0 ? (
                <div className="rounded-lg border border-muted bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Loading skills...
                  </p>
                </div>
              ) : (
                Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                  <div key={category}>
                    <h3 className="mb-3 text-sm font-medium text-foreground">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill) => {
                        const isSelected = selectedSkills.includes(skill.id);
                        const isDisabled = !isSelected && selectedSkills.length >= MAX_SKILLS;
                        return (
                          <Badge
                            key={skill.id}
                            variant={isSelected ? "default" : "outline"}
                            className={`transition-colors ${isSelected
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                              : isDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-muted cursor-pointer"
                              }`}
                            onClick={() => !isDisabled && toggleSkill(skill.id)}
                          >
                            {isSelected && <Check className="mr-1 h-3 w-3" />}
                            {skill.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedSkills.length}</span>{" "}
                  of {MAX_SKILLS} skills selected
                  {selectedSkills.length >= MAX_SKILLS && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      (Maximum reached)
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Looking For */}
        {step === 3 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Skills You Are Looking For</CardTitle>
              <CardDescription>
                Select up to {MAX_SKILLS} skills you want in your teammates. This helps us suggest good matches.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {skills.length === 0 ? (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">
                    No skills available. Please contact support or check if skills have been seeded in the database.
                  </p>
                </div>
              ) : Object.keys(skillsByCategory).length === 0 ? (
                <div className="rounded-lg border border-muted bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    Loading skills...
                  </p>
                </div>
              ) : (
                Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                  <div key={category}>
                    <h3 className="mb-3 text-sm font-medium text-foreground">{category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill) => {
                        const isSelected = lookingFor.includes(skill.id);
                        const isDisabled = !isSelected && lookingFor.length >= MAX_SKILLS;
                        return (
                          <Badge
                            key={skill.id}
                            variant={isSelected ? "default" : "outline"}
                            className={`transition-colors ${isSelected
                              ? "bg-accent text-accent-foreground hover:bg-accent/90 cursor-pointer"
                              : isDisabled
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-muted cursor-pointer"
                              }`}
                            onClick={() => !isDisabled && toggleLookingFor(skill.id)}
                          >
                            {isSelected && <Check className="mr-1 h-3 w-3" />}
                            {skill.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  Looking for <span className="font-medium text-foreground">{lookingFor.length}</span>{" "}
                  of {MAX_SKILLS} skills
                  {lookingFor.length >= MAX_SKILLS && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      (Maximum reached)
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Project Interests */}
        {step === 4 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Project Interests</CardTitle>
              <CardDescription>
                What types of projects are you interested in working on? Add topics like "NLP", "Web Dev", "Data Viz", etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interestInput">Add Project Interest</Label>
                <div className="flex gap-2">
                  <Input
                    id="interestInput"
                    placeholder="e.g., NLP, Web Dev, Data Visualization"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim();
                        if (value && !projectInterests.includes(value)) {
                          setProjectInterests([...projectInterests, value]);
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("interestInput") as HTMLInputElement;
                      const value = input?.value.trim();
                      if (value && !projectInterests.includes(value)) {
                        setProjectInterests([...projectInterests, value]);
                        input.value = "";
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {projectInterests.length > 0 && (
                <div className="space-y-2">
                  <Label>Your Project Interests</Label>
                  <div className="flex flex-wrap gap-2">
                    {projectInterests.map((interest, index) => (
                      <Badge
                        key={index}
                        variant="default"
                        className="cursor-pointer gap-1"
                        onClick={() => setProjectInterests(projectInterests.filter((_, i) => i !== index))}
                      >
                        {interest}
                        <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {projectInterests.length === 0 && (
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No interests added yet. Add some to help others find you!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Availability */}
        {step === 5 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Your Availability</CardTitle>
              <CardDescription>
                When are you typically free to work on projects? Click to toggle availability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-sm font-medium text-muted-foreground" />
                      {DAYS.map((day) => (
                        <th
                          key={day}
                          className="p-2 text-center text-sm font-medium text-foreground"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot) => (
                      <tr key={slot}>
                        <td className="p-2 text-sm text-muted-foreground">{slot}</td>
                        {DAYS.map((day) => {
                          const key = `${day}-${slot}`;
                          const isAvailable = availability[key];
                          return (
                            <td key={key} className="p-1">
                              <button
                                type="button"
                                onClick={() => toggleAvailability(day, slot)}
                                className={`h-10 w-full rounded-md transition-colors ${isAvailable
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80"
                                  }`}
                              >
                                {isAvailable && <Check className="mx-auto h-4 w-4" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-lg bg-muted p-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-primary" />
                    <span className="text-muted-foreground">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-muted-foreground/20" />
                    <span className="text-muted-foreground">Not available</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && (!formData.name || !formData.major || !teamSizePreference || !contactPreference || !status)}
            >
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
