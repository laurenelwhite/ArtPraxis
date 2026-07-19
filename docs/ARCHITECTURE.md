# Architecture

The browser uses Firebase Authentication, Firestore, and Storage. A Next.js server route calls OpenAI so the API key never reaches the browser. OpenAI output is parsed with Zod before it is returned or saved.

Documents live at `users/{uid}/projects/{projectId}`. Images live at `users/{uid}/projects/{projectId}/{filename}`. Firebase rules restrict both to the owning authenticated user.

The MVP sends a base64 image to the server route. Before scale, upload first and have an authenticated server retrieve the object from Storage.
