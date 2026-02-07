"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  User,
  Loader2,
  Save,
  Check,
  X,
  Github,
  Linkedin,
  Globe,
  ArrowLeft,
} from "lucide-react";

interface Skill {
  id: string;
  name: string;
  category: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = ["Morning", "Afternoon", "Evening"];

export default function MyProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
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
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Fetch skills list
      const { data: skillsData } = await supabase.from("skills").select("*").order("category");
      if (skillsData) setSkills(skillsData);

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          `
          name,
          major,
          graduation_year,
          bio,
          linkedin_url,
          github_url,
          portfolio_url,
          profile_skills(skill_id),
          profile_looking_for(skill_id),
          availability(day_of_week, time_of_day),
          team_size_preference,
          contact_preference,
          contact_handle,
          status
        `
        )
        .eq("id", user.id)
        .single();

      if (profile) {
        setFormData({
          name: profile.name || "",
          major: profile.major || "",
          graduationYear: profile.graduation_year?.toString() || "",
          bio: profile.bio || "",
          linkedinUrl: profile.linkedin_url || "",
          githubUrl: profile.github_url || "",
          portfolioUrl: profile.portfolio_url || "",
        });

        setSelectedSkills(profile.profile_skills?.map((ps: { skill_id: string }) => ps.skill_id) || []);
        setLookingFor(profile.profile_looking_for?.map((plf: { skill_id: string }) => plf.skill_id) || []);

        const DAYS_MAP_REVERSE: Record<string, string> = {
          "monday": "Mon",
          "tuesday": "Tue",
          "wednesday": "Wed",
          "thursday": "Thu",
          "friday": "Fri",
          "saturday": "Sat",
          "sunday": "Sun"
        };
        const avail: Record<string, boolean> = {};
        profile.availability?.forEach((a: { day_of_week: string; time_of_day: string }) => {
          const dayAbbr = DAYS_MAP_REVERSE[a.day_of_week.toLowerCase()] || a.day_of_week.substring(0, 3);
          const time = a.time_of_day.charAt(0).toUpperCase() + a.time_of_day.slice(1);
          avail[`${dayAbbr}-${time}`] = true;
        });
        setAvailability(avail);
        
        // Load project interests
        const { data: interestsData } = await supabase
          .from("project_interests")
          .select("interest")
          .eq("profile_id", user.id);
        
        if (interestsData) {
          setProjectInterests(interestsData.map((i: { interest: string }) => i.interest));
        }
        
        // Set additional fields
        if (profile.team_size_preference) setTeamSizePreference(profile.team_size_preference);
        if (profile.contact_preference) setContactPreference(profile.contact_preference);
        if (profile.contact_handle) setContactHandle(profile.contact_handle);
        if (profile.status) setStatus(profile.status);
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  const toggleLookingFor = (skillId: string) => {
    setLookingFor((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  const toggleAvailability = (day: string, timeSlot: string) => {
    const key = `${day}-${timeSlot}`;
    setAvailability((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setSuccess(false);

    const supabase = createClient();

    // Update profile
    await supabase
      .from("profiles")
      .update({
        name: formData.name,
        major: formData.major,
        graduation_year: formData.graduationYear ? parseInt(formData.graduationYear) : null,
        bio: formData.bio,
        linkedin_url: formData.linkedinUrl || null,
        github_url: formData.githubUrl || null,
        portfolio_url: formData.portfolioUrl || null,
      })
      .eq("id", userId);

    // Update skills
    await supabase.from("profile_skills").delete().eq("profile_id", userId);
    if (selectedSkills.length > 0) {
      await supabase.from("profile_skills").insert(
        selectedSkills.map((skillId) => ({
          profile_id: userId,
          skill_id: skillId,
        }))
      );
    }

    // Update looking for
    await supabase.from("profile_looking_for").delete().eq("profile_id", userId);
    if (lookingFor.length > 0) {
      await supabase.from("profile_looking_for").insert(
        lookingFor.map((skillId) => ({
          profile_id: userId,
          skill_id: skillId,
        }))
      );
    }

    // Update availability
    await supabase.from("availability").delete().eq("profile_id", userId);
    const DAYS_MAP: Record<string, string> = {
      "Mon": "monday",
      "Tue": "tuesday",
      "Wed": "wednesday",
      "Thu": "thursday",
      "Fri": "friday",
      "Sat": "saturday",
      "Sun": "sunday"
    };
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
      await supabase.from("availability").insert(availabilityInserts);
    }

    // Update project interests
    await supabase.from("project_interests").delete().eq("profile_id", userId);
    if (projectInterests.length > 0) {
      const interestInserts = projectInterests.map((interest) => ({
        profile_id: userId,
        interest: interest.trim(),
      }));
      await supabase.from("project_interests").insert(interestInserts);
    }

    // Update additional profile fields
    await supabase
      .from("profiles")
      .update({
        team_size_preference: teamSizePreference,
        contact_preference: contactPreference,
        contact_handle: contactHandle || null,
        status: status,
      })
      .eq("id", userId);

    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const skillsByCategory = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile information and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : success ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {success ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Basic Info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <User className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                value={formData.major}
                onChange={(e) => setFormData((prev) => ({ ...prev, major: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input
              id="graduationYear"
              value={formData.graduationYear}
              onChange={(e) => setFormData((prev) => ({ ...prev, graduationYear: e.target.value }))}
              className="max-w-32"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Add links to your professional profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub
            </Label>
            <Input
              id="github"
              placeholder="https://github.com/username"
              value={formData.githubUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, githubUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Label>
            <Input
              id="linkedin"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Portfolio
            </Label>
            <Input
              id="portfolio"
              placeholder="https://yourportfolio.com"
              value={formData.portfolioUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Your Skills</CardTitle>
          <CardDescription>Select the skills you have</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-medium text-foreground">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill) => {
                  const isSelected = selectedSkills.includes(skill.id);
                  return (
                    <Badge
                      key={skill.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {isSelected && <Check className="mr-1 h-3 w-3" />}
                      {skill.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Looking For */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Skills You Are Looking For</CardTitle>
          <CardDescription>Select skills you want in your teammates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-medium text-foreground">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((skill) => {
                  const isSelected = lookingFor.includes(skill.id);
                  return (
                    <Badge
                      key={skill.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-accent text-accent-foreground hover:bg-accent/90"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleLookingFor(skill.id)}
                    >
                      {isSelected && <Check className="mr-1 h-3 w-3" />}
                      {skill.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Availability */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Your Availability</CardTitle>
          <CardDescription>When are you free to work on projects?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="p-2 text-left text-sm font-medium text-muted-foreground" />
                  {DAYS.map((day) => (
                    <th key={day} className="p-2 text-center text-sm font-medium text-foreground">
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
                            className={`h-10 w-full rounded-md transition-colors ${
                              isAvailable
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
        </CardContent>
      </Card>

      {/* Project Interests */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Project Interests</CardTitle>
          <CardDescription>What types of projects are you interested in?</CardDescription>
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
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Your team and contact preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="teamSize">Team Size Preference</Label>
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
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="looking">Looking for team</SelectItem>
                  <SelectItem value="open_to_offers">Open to offers</SelectItem>
                  <SelectItem value="in_team">In a team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPreference">Preferred Contact Method</Label>
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
    </div>
  );
}
