# SmartEditor

SmartEditor is a modern AI-assisted writing workspace. It combines a rich ProseMirror editor, multi-provider AI continuation (Gemini, OpenAI, Mistral), local session saving, and an elegant UI inspired by professional writing tools.

---

## ✨ Key Features

- **Multi-provider AI continuation** – Switch instantly between Gemini, OpenAI and Mistral while writing.
- **Rich formatting controls** – Bold, italic, underline, font-size adjustments, and keyboard shortcuts (`Cmd/Ctrl + Enter`).
- **Local session management** – Save, reopen, and overwrite drafts directly in the UI.
- **Real-time word count & title management** – Track progress and organize your drafts.
- **Responsive, polished UI** – Gradient cards, sidebar for saved documents, and keyboard-focused interactions.

---

## 🚀 Getting Started

### 1. Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js     | 20.x (ships with npm 10/11) |
| npm         | 10+ |
| Git         | latest |

> **Tip:** Install [Node.js 20 LTS](https://nodejs.org/en/download) to get a compatible npm version.

### 2. Clone & Install

**macOS / Linux**
```bash
git clone https://github.com/your-username/smarteditor.git
cd smarteditor
npm install
```

**Windows (PowerShell)**
```powershell
git clone https://github.com/your-username/smarteditor.git
Set-Location smarteditor
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

**macOS / Linux**
```bash
cp .env.example .env   # if example file exists, or create manually
```

**Windows (PowerShell)**
```powershell
Copy-Item .env.example .env   # if example file exists, or create manually
```

Add the following keys (replace with your credentials):

```dotenv
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
MISTRAL_API_KEY=your_mistral_key
```

All providers are optional, but the currently selected provider must have a valid key or the app will display a descriptive toast error.

### 4. Run the App

**macOS / Linux**
```bash
npm run dev
```

**Windows (PowerShell)**
```powershell
npm run dev
```

Navigate to `http://localhost:5173` (or the port shown in the terminal).

---

## 📚 Usage Notes

- **AI Switcher:** Use the dropdown in the format bar to select Gemini/OpenAI/Mistral. The choice persists in the current session.
- **Keyboard Shortcuts:** `Cmd/Ctrl + Enter` or `Cmd/Ctrl + Shift + Enter` to trigger AI continuation.
- **Saved Sessions:** The right sidebar stores drafts locally. Click a card to load, or delete via the corner button.
- **Clear Editor:** Use the “Clear” button when you need a fresh slate.

---

## 🛠 Tech Stack

- **Frontend:** React 18, Vite, TypeScript, TailwindCSS, Radix UI
- **State Management:** XState
- **Editor:** ProseMirror
- **AI Integrations:** Google Gemini (`@google/genai`), OpenAI (`openai`), Mistral (REST API)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit & push
4. Open a Pull Request

---

## 📄 License

MIT © Vikash Chahar

Enjoy writing with SmartEditor! ✍️

