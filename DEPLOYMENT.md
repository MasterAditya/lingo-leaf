# LingoLeaf Deployment Instructions

## Prerequisites
- GitHub repository: https://github.com/MasterAditya/lingo-leaf.git
- Vercel account (free tier available)
- Render account (free tier available)

## Backend Deployment (Render)

1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select the `lingo-leaf` repository
5. Configure:
   - **Name**: lingo-leaf-backend
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Runtime**: Python 3.10
6. Click "Create Web Service"
7. Wait for deployment to complete
8. Copy the production URL (e.g., `https://lingo-leaf-backend.onrender.com`)

## Frontend Deployment (Vercel)

1. Go to https://vercel.com and sign up/login
2. Click "Add New..." → "Project"
3. Import the `lingo-leaf` repository from GitHub
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: Your backend URL from Render (e.g., `https://lingo-leaf-backend.onrender.com`)
5. Click "Deploy"
6. Wait for deployment to complete
7. Copy the production URL (e.g., `https://lingo-leaf.vercel.app`)

## Verification

After both deployments are complete:

1. Visit the frontend URL
2. Test registration/login
3. Navigate to Learn page
4. Click on a lesson
5. Test exercise submission
6. Test logout

## Important Notes

- The backend uses SQLite, which will be reset on each Render deployment
- For production, consider using PostgreSQL instead of SQLite
- The application uses HTTP-only cookies for authentication
- Both services include free tier options