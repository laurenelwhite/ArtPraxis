# ArtPraxis Complete Visual V1

This is the complete ArtPraxis project with the original MVP and Visual Tutorial V1 already merged.

## Start fresh

1. Extract this ZIP to a simple permanent folder, for example:

   `C:\Users\Laure\Documents\Projects\ArtPraxis`

2. Open that extracted folder in Cursor or VS Code. Open the folder that directly contains `package.json`.

3. Create `.env.local` beside `package.json` using `.env.example` as the template. Add your Firebase web configuration and your new OpenAI API key. Never paste the key into chat.

4. Open **Command Prompt** in the project folder and run:

   ```cmd
   npm install
   npm run dev
   ```

5. Open the Local URL shown in the terminal.

## Included

- Next.js + TypeScript
- Firebase Email/Password and Google authentication
- Firestore project saving
- Firebase Storage uploads
- OpenAI structured outputs
- Visual shape, value, and warm/cool overlays
- Palette and mixing cards
- Step timeline and image-region highlights

## Important

- Do not run the app from inside the ZIP. Extract it first.
- Use this folder as your single source of truth. Archive or ignore older `ArtPraxis-MVP` and patch folders.
- A ChatGPT subscription does not include OpenAI API usage.
