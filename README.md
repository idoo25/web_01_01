# Keren Web - Interview Management System

A full-stack web application for managing job interviews, group reflections, and instructor dashboards.

## Tech Stack

### Frontend
- React 18.3 with Vite
- React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons
- Recharts for data visualization
- Firebase for authentication and database
- Google Generative AI for question generation

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- CORS enabled

## Project Structure

```
keren-web/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── connection/          # Login and signup components
│   │   ├── general/             # Dashboard and interview system
│   │   ├── groupreflection/     # Group reflection features
│   │   ├── history/             # Interview history
│   │   └── newinterview/        # New interview creation
│   ├── services/                # API services
│   ├── App.jsx                  # Main app component
│   └── main.jsx                 # App entry point
├── backend/                      # Backend API
│   ├── models/                  # MongoDB models
│   ├── routes/                  # API routes
│   ├── middleware/              # Auth middleware
│   └── services/                # Background services
├── public/                       # Static assets
└── index.html                    # HTML entry point

```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB instance
- Firebase project
- Google AI API key

### Frontend Setup

1. Clone the repository:
```bash
git clone https://github.com/idoo25/keren-web.git
cd keren-web
```

2. Install frontend dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
VITE_API_BASE_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install backend dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret_key
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

## Available Scripts

### Frontend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

### Backend
- `npm start` - Start the backend server

## Features

- **User Authentication**: Login and signup with JWT tokens
- **Interview Management**: Create, manage, and view interview records
- **AI Question Generation**: Generate interview questions using Google AI
- **Group Reflections**: Team-based reflection system
- **Instructor Dashboard**: Monitor students and teams
- **Interview History**: View past interviews and summaries

## Security Notes

- Never commit `.env` files with real credentials
- API keys and secrets should be stored in environment variables
- The repository includes `.env.example` as a template

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is private and proprietary.

