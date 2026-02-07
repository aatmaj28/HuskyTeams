import { Skill } from "@/app/dashboard/page";

interface Profile {
  id: string;
  skills: Skill[];
  looking_for: Skill[];
  availability: { day_of_week: string; time_slot: string }[];
  project_interests: string[];
  team_size_preference: number | null;
}

interface CompatibilityScore {
  total: number;
  breakdown: {
    skillComplementarity: number;
    availabilityOverlap: number;
    projectInterestAlignment: number;
    teamSizeCompatibility: number;
    skillDiversityBonus: number;
    mutualInterestBoost: number;
  };
}

/**
 * Calculate compatibility score between current user and a potential teammate
 * Returns a score from 0-100
 */
export function calculateCompatibilityScore(
  currentUser: Profile,
  otherProfile: Profile,
  hasMutualInterest: boolean = false
): CompatibilityScore {
  // 1. Skill Complementarity (30%)
  const skillScore = calculateSkillComplementarity(currentUser, otherProfile);

  // 2. Availability Overlap (25%)
  const availabilityScore = calculateAvailabilityOverlap(
    currentUser.availability,
    otherProfile.availability
  );

  // 3. Project Interest Alignment (20%)
  const projectInterestScore = calculateProjectInterestAlignment(
    currentUser.project_interests,
    otherProfile.project_interests
  );

  // 4. Team Size Compatibility (10%)
  const teamSizeScore = calculateTeamSizeCompatibility(
    currentUser.team_size_preference,
    otherProfile.team_size_preference
  );

  // 5. Skill Diversity Bonus (10%)
  const diversityScore = calculateSkillDiversity(currentUser.skills, otherProfile.skills);

  // 6. Mutual Interest Boost (5%)
  const mutualInterestScore = hasMutualInterest ? 100 : 0;

  // Calculate weighted total
  const total =
    skillScore * 0.3 +
    availabilityScore * 0.25 +
    projectInterestScore * 0.2 +
    teamSizeScore * 0.1 +
    diversityScore * 0.1 +
    mutualInterestScore * 0.05;

  return {
    total: Math.round(total),
    breakdown: {
      skillComplementarity: Math.round(skillScore),
      availabilityOverlap: Math.round(availabilityScore),
      projectInterestAlignment: Math.round(projectInterestScore),
      teamSizeCompatibility: Math.round(teamSizeScore),
      skillDiversityBonus: Math.round(diversityScore),
      mutualInterestBoost: mutualInterestScore,
    },
  };
}

/**
 * Skill Complementarity (30% weight)
 * Checks bidirectional matching: do they have what you need, and do you have what they need?
 */
function calculateSkillComplementarity(currentUser: Profile, otherProfile: Profile): number {
  const currentLookingForIds = new Set(currentUser.looking_for.map((s) => s.id));
  const currentHasIds = new Set(currentUser.skills.map((s) => s.id));
  const otherHasIds = new Set(otherProfile.skills.map((s) => s.id));
  const otherLookingForIds = new Set(otherProfile.looking_for.map((s) => s.id));

  // How many of your "looking for" skills do they have?
  let matchesYouNeed = 0;
  currentLookingForIds.forEach((skillId) => {
    if (otherHasIds.has(skillId)) matchesYouNeed++;
  });

  // How many of their "looking for" skills do you have?
  let matchesTheyNeed = 0;
  otherLookingForIds.forEach((skillId) => {
    if (currentHasIds.has(skillId)) matchesTheyNeed++;
  });

  // Calculate scores for each direction
  const yourNeedScore =
    currentLookingForIds.size > 0 ? (matchesYouNeed / currentLookingForIds.size) * 100 : 50;
  const theirNeedScore =
    otherLookingForIds.size > 0 ? (matchesTheyNeed / otherLookingForIds.size) * 100 : 50;

  // Average of both directions (both people should benefit)
  return (yourNeedScore + theirNeedScore) / 2;
}

/**
 * Availability Overlap (25% weight)
 * How many time slots do you both have free?
 */
function calculateAvailabilityOverlap(
  currentAvailability: { day_of_week: string; time_slot: string }[],
  otherAvailability: { day_of_week: string; time_slot: string }[]
): number {
  if (currentAvailability.length === 0 || otherAvailability.length === 0) {
    return 0;
  }

  // Create sets of availability slots
  const currentSlots = new Set(
    currentAvailability.map((a) => `${a.day_of_week.toLowerCase()}-${a.time_slot.toLowerCase()}`)
  );
  const otherSlots = new Set(
    otherAvailability.map((a) => `${a.day_of_week.toLowerCase()}-${a.time_slot.toLowerCase()}`)
  );

  // Count overlapping slots
  let overlapCount = 0;
  currentSlots.forEach((slot) => {
    if (otherSlots.has(slot)) overlapCount++;
  });

  // Score based on overlap relative to total possible slots
  // Use the smaller set as denominator to avoid penalizing people with more availability
  const minSlots = Math.min(currentSlots.size, otherSlots.size);
  return minSlots > 0 ? (overlapCount / minSlots) * 100 : 0;
}

/**
 * Project Interest Alignment (20% weight)
 * Do you want to build similar things?
 */
function calculateProjectInterestAlignment(
  currentInterests: string[],
  otherInterests: string[]
): number {
  if (currentInterests.length === 0 || otherInterests.length === 0) {
    return 50; // Neutral score if one person hasn't specified interests
  }

  // Normalize interests to lowercase for comparison
  const currentNormalized = currentInterests.map((i) => i.toLowerCase().trim());
  const otherNormalized = otherInterests.map((i) => i.toLowerCase().trim());

  // Check for exact matches or partial matches
  let matches = 0;
  currentNormalized.forEach((interest) => {
    if (otherNormalized.some((other) => other.includes(interest) || interest.includes(other))) {
      matches++;
    }
  });

  // Score based on how many of your interests match theirs
  return (matches / currentInterests.length) * 100;
}

/**
 * Team Size Compatibility (10% weight)
 * Do you want similar team sizes?
 */
function calculateTeamSizeCompatibility(
  currentSize: number | null,
  otherSize: number | null
): number {
  if (currentSize === null || otherSize === null) {
    return 50; // Neutral if not specified
  }

  if (currentSize === otherSize) {
    return 100; // Perfect match
  }

  // Partial credit if within 1 of each other
  const diff = Math.abs(currentSize - otherSize);
  if (diff === 1) {
    return 75;
  }

  // Lower score for larger differences
  return Math.max(0, 100 - diff * 25);
}

/**
 * Skill Diversity Bonus (10% weight)
 * Teams with varied skills perform better. Penalize if you have the exact same skillset.
 */
function calculateSkillDiversity(currentSkills: Skill[], otherSkills: Skill[]): number {
  if (currentSkills.length === 0 || otherSkills.length === 0) {
    return 50; // Neutral if one person has no skills listed
  }

  const currentSkillIds = new Set(currentSkills.map((s) => s.id));
  const otherSkillIds = new Set(otherSkills.map((s) => s.id));

  // Count unique skills (union)
  const allUniqueSkills = new Set([...currentSkillIds, ...otherSkillIds]);

  // Count overlapping skills (intersection)
  let overlapCount = 0;
  currentSkillIds.forEach((skillId) => {
    if (otherSkillIds.has(skillId)) overlapCount++;
  });

  // Calculate diversity: more unique skills = better, but some overlap is good
  // Perfect diversity: all skills are unique (no overlap)
  // Perfect overlap: all skills are the same (bad)
  const overlapRatio = overlapCount / Math.min(currentSkillIds.size, otherSkillIds.size);

  // Score: 100 if no overlap (too diverse), 0 if all overlap (redundant)
  // Sweet spot: some overlap (30-50%) = good team balance
  if (overlapRatio === 0) {
    return 70; // Too diverse, might lack cohesion
  } else if (overlapRatio <= 0.3) {
    return 100; // Good diversity with some overlap
  } else if (overlapRatio <= 0.5) {
    return 80; // Moderate overlap, still good
  } else if (overlapRatio <= 0.7) {
    return 50; // High overlap, less diversity
  } else {
    return 20; // Very high overlap, redundant skills
  }
}
