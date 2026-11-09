export type MembershipStatus = "active" | "inactive" | "pending";

export type ProfileViewRole = "player" | "coach" | "bureau";

export type MembershipCardData = {
  teamName: string;
  clubName?: string | null;
  season?: string | null;
  status: MembershipStatus | null;
  email?: string | null;
  phone?: string | null;
};

export type UpdatePersonalProfileInput = {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
};
