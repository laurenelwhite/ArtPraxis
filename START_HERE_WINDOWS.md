# Start Here on Windows

## 1. Extract
Right-click the ZIP, choose **Extract All**, and extract to:

`C:\Users\Laure\Documents\Projects\ArtPraxis`

## 2. Open in Cursor
Open Cursor IDE, choose **File > Open Folder**, and select the extracted `ArtPraxis` folder containing `package.json`.

## 3. Add environment settings
Create `.env.local` next to `package.json` and copy the blank lines from `.env.example`. Fill in your Firebase values and OpenAI key.

## 4. Run
Open a Command Prompt terminal in Cursor and run:

```cmd
npm install
npm run dev
```

## 5. Test
Sign in, upload an image, select a medium and experience level, and click **Generate visual lesson**.
