# PrepmyExam - AI-Powered Competitive Exam Preparation Platform

**Live Demo:** [https://prepmyexam.kolassrexon.in/](https://prepmyexam.kolassrexon.in/) 

**PrepmyExam** is a modern, comprehensive web application designed to help aspirants prepare for Indian competitive exams (Banking, SSC, UPSC, Railways, State PSCs). It combines real-time exam simulation, AI-powered tutoring, and detailed performance analytics to give students a competitive edge.



## Key Features

### Core Learning & Exam Engine
- **Real Exam Interface**: Practice environment mimicking actuaI exam interfaces (Timer, Question Palette, Mark for Review).
- **AI-Powered Prompt Creator**: Generate custom study prompts and question sets for specific exams (IBPS, SSC CGL, UPSC) using advanced AI integration.
- **Detailed Analytics**: Track performance with "Overall Score" and "Total Attempts" metrics.
- **Review System**: Comprehensive post-exam analysis to identify weak areas.

### User Experience & Identity
- **Dynamic Dashboard**: Personalized landing page with quick access to stats, prompt creator, and recent question sets.
- **Public Profile System**: Shareable user profiles (`/user/[uid]`) featuring a **GitHub-style Contribution Graph** to visualize study consistency.
- **Customizable Themes**: 
    - Full **Dark/Light Mode** support.
    - Full **Dark/Light Mode** support.
    - **Dynamic Color Themes**: Users can choose their preferred primary color (Violet, Blue, Emerald, Amber, Rose, Slate).

### 🌐 Multilingual Support
- **6 Supported Languages**: 
  - English, Hindi (हिन्दी), Tamil (தமிழ்), Malayalam (മലയാളം), Kannada (ಕನ್ನಡ), Telugu (తెలుగు).
- **Persistent Preferences**: Language, theme, and color settings are saved to your user profile and synced across devices via a secure server-side API.
- **Instant Switching**: Seamless language transitions without page reloads.

###  Educational Tools
- **Upload & Parse**: Support for uploading custom question sets (JSON).
- **Exam Management**: Rename, organize, and track history of taken exams.
- **Mobile Responsive**: Fully optimized mobile interface with responsive navigation and adaptive layouts.

## Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + CSS Variables for dynamic theming.
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth) (Google Sign-In).
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore).
- **Animations**: [GSAP](https://greensock.com/gsap) & [Framer Motion](https://www.framer.com/motion/).
- **Icons**: [Lucide React](https://lucide.dev/).
- **AI Integration**: Google Gemini API (via custom `gemini.ts` lib).

##  Project Structure

```bash
src/
├── app/                  # Next.js App Router pages
│   ├── admin/            # Admin Panel (Question Banks, Users, Settings)
│   ├── api/              # API Routes (Chat, User Stats, Exam management)
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Main User Dashboard
│   ├── exam/             # Exam taking interface
│   ├── exam-dashboard/   # Individual Exam Details & Stats
│   ├── prompt/           # AI Prompt Creator tool
│   ├── question-banks/   # Public Question Bank Libraries
│   └── user/             # Public Profile pages
├── components/           # Reusable UI Components
│   ├── auth/             # Login buttons/forms
│   ├── dashboard/        # Dashboard widgets (UserMenu, Stats)
│   ├── exam/             # Exam interface components
│   ├── language/         # Language switching components
│   └── ui/               # Generic UI elements
├── language/             # Localization JSON files (en, hi, ta, etc.)
├── lib/                  # Utilities & Configurations
│   ├── firebase/         # Firebase Client/Admin init
│   └── gemini.ts         # AI Model configuration
└── context/              # React Context (AuthContext, LanguageContext)
```

##  JSON Upload Format

You can upload custom exam sets using a JSON file. The system supports defining a custom `title` and an array of `questions`.

```json
[
  {
    "title": "Bank PO Reasoning Practice Set",
    "questions": [
      {
        "id": 1,
        "question": "### Question text here",
        "options": {
          "a": "Option A",
          "b": "Option B",
          "c": "Option C",
          "d": "Option D"
        },
        "correct_answer": "a"
      }
    ]
  }
]
```

**Note:** You can also paste this JSON content directly into the **JSON Input** tab on the upload page.

##  Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/bankexam.git
    cd bankexam
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory and add your Firebase and AI API credentials:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    # ... other firebase config
    GEMINI_API_KEY=...
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  **Open the app**:
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

##  Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

##  License

© 2026 Uvite Technologies. All rights reserved.
