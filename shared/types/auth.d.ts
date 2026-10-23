// What is stored in the session cookie for a logged-in user
declare module "#auth-utils" {
  interface User {
    id: string;
    displayName: string;
    hiddenName: string;
  }
}

export {};
