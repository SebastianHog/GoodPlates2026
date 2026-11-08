// A schedule in a list: enough for a card
export interface IScheduleSummary {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  owner: IAuthor;
  dayCount: number;
  recipeCount: number;
  // Cover photo keys of the first few recipes that have one
  coverImages: string[];
  // Set on a copy saved from someone else's schedule
  savedFrom: { id: string } | null;
  createdAt: string;
  modifiedAt: string;
}

// The schedule a copy was saved from
export interface IScheduleSource {
  id: string;
  // Null when the original was deleted or made private
  name: string | null;
  owner: Pick<IAuthor, "displayName" | "hiddenName"> | null;
  changedSinceSave: boolean;
}

// One whole schedule, with its recipes
export interface ISchedule extends IScheduleSummary {
  days: ScheduleDay[];
  // The recipes by id; a recipe that was deleted is missing
  posts: Record<string, IPostContent>;
  source: IScheduleSource | null;
  // The viewer's copy of this schedule, when they saved one
  mySavedCopyId: string | null;
}
