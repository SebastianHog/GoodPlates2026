declare module "#auth-utils" {
  interface User {
    id: string;
    displayName: string;
    hiddenName: string;
    // Bumped on logout so a copied cookie from before then stops working (see server/utils/users.ts)
    sessionVersion: number;
  }
}

export {};
