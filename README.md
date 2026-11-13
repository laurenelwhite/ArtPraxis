# ArtPraxis V1

ArtPraxis turns a reference image into a personalized, stage-by-stage painting lesson.

## Start fresh

1. Extract this ZIP to a simple permanent folder, for example:

   `C:\Users\Laure\Documents\Projects\ArtPraxis`

2. Open that extracted folder in Cursor or VS Code. Open the folder that directly contains `package.json`.

3. Create `.env.local` beside `package.json` using `.env.example` as the template. Add your Firebase web configuration and an OpenAI API key for local server-side use. Never commit the populated file or expose the key through a `NEXT_PUBLIC_` variable.

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

## Validate

```cmd
npm run lint
npm run typecheck
npm test
npm run test:firestore-rules
npm run test:storage-rules
npm run build
```

The Firebase rules checks use local emulators and require a supported Java
runtime on `PATH`. They do not connect to or change production data.

## Production

The checked-in `apphosting.yaml` is staging-only and intentionally disables paid generation. See `docs/V1_PRODUCTION_HANDOFF.md` and `apphosting.production.example.yaml` before creating a production rollout. Validate the completed environment-specific file with `npm run validate:production -- path/to/apphosting.production.yaml`.

## Important

- Do not run the app from inside the ZIP. Extract it first.
- Use this folder as your single source of truth. Archive or ignore older `ArtPraxis-MVP` and patch folders.
- A ChatGPT subscription does not include OpenAI API usage.
