import type { EventAudience, PlatformEvent } from "@/types/admin";

export const AUDIENCE_OPTIONS: { value: EventAudience; label: string; description: string }[] = [
  { value: "everyone", label: "Everyone", description: "Individual users and the employees of every organization." },
  { value: "individuals", label: "Individual users", description: "People who use Wellstaq without an organization." },
  { value: "employees", label: "All organization employees", description: "Employees of every organization on Wellstaq." },
  { value: "selected_organizations", label: "Specific organizations", description: "Only employees of the organizations you choose." },
];

export function audienceLabel(event: Pick<PlatformEvent, "audience" | "organizations">): string {
  if (event.audience === "selected_organizations") {
    const count = event.organizations.length;
    return count === 1 ? event.organizations[0].name : `${count} organizations`;
  }
  return AUDIENCE_OPTIONS.find((option) => option.value === event.audience)?.label ?? "Unknown audience";
}
