"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Check, ChevronDown, X, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Skill {
  id: string;
  name: string;
  category: string;
}

interface FilterSidebarProps {
  skills: Skill[];
  selectedSkills: string[];
  selectedAvailability: string[];
  selectedProjectInterests?: string[];
  selectedTeamSize?: number | null;
  selectedStatus?: string | null;
  searchQuery: string;
  onSkillToggle: (skillId: string) => void;
  onAvailabilityToggle: (day: string) => void;
  onProjectInterestToggle?: (interests: string[]) => void;
  onTeamSizeChange?: (size: number | null) => void;
  onStatusChange?: (status: string | null) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  allProfiles?: any[];
}

const DAYS = [
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
  { value: "Sun", label: "Sunday" },
];

export function FilterSidebar({
  skills,
  selectedSkills,
  selectedAvailability,
  selectedProjectInterests = [],
  selectedTeamSize = null,
  selectedStatus = null,
  searchQuery,
  onSkillToggle,
  onAvailabilityToggle,
  onProjectInterestToggle,
  onTeamSizeChange,
  onStatusChange,
  onSearchChange,
  onClearFilters,
  allProfiles = [],
}: FilterSidebarProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [projectInterestInput, setProjectInterestInput] = useState("");

  // Get unique project interests from all profiles
  const availableInterests = Array.from(
    new Set(
      allProfiles.flatMap((p: any) => p.project_interests || [])
    )
  ).sort();

  const skillsByCategory = skills.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>
  );

  const hasFilters =
    selectedSkills.length > 0 || 
    selectedAvailability.length > 0 || 
    searchQuery.length > 0 ||
    (selectedProjectInterests?.length || 0) > 0 ||
    selectedTeamSize !== null ||
    selectedStatus !== null;

  return (
    <Card className="sticky top-24 border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-8 gap-1 px-2">
              <RotateCcw className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Name or major..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Skills Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Skills</Label>
          <div className="space-y-2">
            {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
              <Collapsible
                key={category}
                open={openCategories[category] ?? false}
                onOpenChange={(open) =>
                  setOpenCategories((prev) => ({ ...prev, [category]: open }))
                }
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between px-2 font-normal"
                  >
                    <span className="text-sm">{category}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        openCategories[category] ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="flex flex-wrap gap-1.5 pl-2">
                    {categorySkills.map((skill) => {
                      const isSelected = selectedSkills.includes(skill.id);
                      return (
                        <Badge
                          key={skill.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer text-xs transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => onSkillToggle(skill.id)}
                        >
                          {isSelected && <Check className="mr-1 h-3 w-3" />}
                          {skill.name}
                        </Badge>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* Availability Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Available On</Label>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((day) => {
              const isSelected = selectedAvailability.includes(day.value);
              return (
                <Badge
                  key={day.value}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer text-xs transition-colors ${
                    isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => onAvailabilityToggle(day.value)}
                >
                  {isSelected && <Check className="mr-1 h-3 w-3" />}
                  {day.value}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Project Interests Filter */}
        {onProjectInterestToggle && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Project Interests</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Type interest..."
                  value={projectInterestInput}
                  onChange={(e) => setProjectInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && projectInterestInput.trim()) {
                      e.preventDefault();
                      if (!selectedProjectInterests?.includes(projectInterestInput.trim())) {
                        onProjectInterestToggle([...selectedProjectInterests, projectInterestInput.trim()]);
                      }
                      setProjectInterestInput("");
                    }
                  }}
                  className="h-8 text-xs"
                />
              </div>
              {availableInterests.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {availableInterests.slice(0, 10).map((interest) => {
                    const isSelected = selectedProjectInterests?.includes(interest);
                    return (
                      <Badge
                        key={interest}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer text-xs transition-colors ${
                          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                        onClick={() => {
                          if (onProjectInterestToggle) {
                            if (isSelected) {
                              onProjectInterestToggle(selectedProjectInterests.filter((i) => i !== interest));
                            } else {
                              onProjectInterestToggle([...selectedProjectInterests, interest]);
                            }
                          }
                        }}
                      >
                        {isSelected && <Check className="mr-1 h-3 w-3" />}
                        {interest}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team Size Filter */}
        {onTeamSizeChange && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Team Size Preference</Label>
            <Select
              value={selectedTeamSize?.toString() || undefined}
              onValueChange={(v) => onTeamSizeChange(v ? parseInt(v) : null)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Any size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 members</SelectItem>
                <SelectItem value="3">3 members</SelectItem>
                <SelectItem value="4">4 members</SelectItem>
              </SelectContent>
            </Select>
            {selectedTeamSize !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTeamSizeChange(null)}
                className="h-7 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        )}

        {/* Status Filter */}
        {onStatusChange && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              value={selectedStatus || undefined}
              onValueChange={(v) => onStatusChange(v || null)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="looking">Looking for team</SelectItem>
                <SelectItem value="open_to_offers">Open to offers</SelectItem>
                <SelectItem value="in_team">In a team</SelectItem>
              </SelectContent>
            </Select>
            {selectedStatus && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(null)}
                className="h-7 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        )}

        {/* Active Filters Summary */}
        {hasFilters && (
          <div className="space-y-2 border-t border-border pt-4">
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-1.5">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Search: {searchQuery}
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedSkills.map((skillId) => {
                const skill = skills.find((s) => s.id === skillId);
                return skill ? (
                  <Badge key={skillId} variant="secondary" className="gap-1 pr-1">
                    {skill.name}
                    <button
                      type="button"
                      onClick={() => onSkillToggle(skillId)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
              {selectedAvailability.map((day) => (
                <Badge key={day} variant="secondary" className="gap-1 pr-1">
                  {day}
                  <button
                    type="button"
                    onClick={() => onAvailabilityToggle(day)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedProjectInterests?.map((interest) => (
                <Badge key={interest} variant="secondary" className="gap-1 pr-1">
                  {interest}
                  <button
                    type="button"
                    onClick={() => {
                      if (onProjectInterestToggle) {
                        onProjectInterestToggle(selectedProjectInterests.filter((i) => i !== interest));
                      }
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedTeamSize !== null && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Team: {selectedTeamSize}
                  <button
                    type="button"
                    onClick={() => onTeamSizeChange?.(null)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedStatus && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {selectedStatus === "looking" ? "Looking" : selectedStatus === "open_to_offers" ? "Open" : "In Team"}
                  <button
                    type="button"
                    onClick={() => onStatusChange?.(null)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
