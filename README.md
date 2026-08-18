# AI Prompt Library

AI Prompt Library is a full-stack application for creating, organizing, searching, and reusing AI prompts.

This project was developed as part of a frontend/full-stack engineering assessment. It demonstrates React and TypeScript fundamentals, state management, CRUD operations, REST API integration, database persistence, LocalStorage persistence, responsive design, form validation, and reusable component architecture.

## Project overview

The application provides a central workspace for managing reusable AI prompts. Users can create prompts with structured metadata, find them using search and filters, and manage their collection through a responsive dashboard.

The application includes:

- A React and TypeScript frontend
- A Redux Toolkit state layer
- An Express REST API
- MongoDB persistence through Mongoose
- LocalStorage persistence for prompt state and theme preference

## Features

### Dashboard

- Total prompt count
- Favorite prompt count
- Pinned prompt count
- Number of categories in use
- Recently added prompts through newest-first sorting

### Prompt management

Each prompt supports:

- Create
- Edit
- Delete with confirmation
- Duplicate
- Favorite and unfavorite
- Pin and unpin
- Copy content to the clipboard
- Drag-and-drop reordering

Each prompt contains:

- Title
- Prompt content
- Category
- Tags
- Description
- Created date
- Last updated date
- Favorite status
- Pinned status

### Search, filtering, and sorting

Prompts can be searched by:

- Title
- Prompt content
- Description
- Tags

Prompts can be filtered by:

- All prompts
- Category
- Favorites
- Pinned prompts

Sorting options:

- Newest
- Oldest
- Title A–Z
- Title Z–A

### Import and export

- Export all prompts as a JSON file
- Import prompts from a JSON file
- Validate imported JSON structure before adding it to the library
- Persist imported data in LocalStorage

### Theme

- Light mode
- Dark mode
- Theme preference persisted across page reloads

### User feedback

The application provides feedback for:

- Successful prompt creation, update, and deletion
- Favorite and pin actions
- Clipboard actions
- Import and export actions
- Validation errors
- API and database errors
- Loading states

## Categories

The application uses these ten categories:

1. Coding
2. Marketing
3. Content Writing
4. Email
5. Resume
6. SQL
7. Design
8. Social Media
9. Productivity
10. Others

## Technology stack

### Frontend

- React 19
- TypeScript
- Vite
- Redux Toolkit
- React Redux
- React Hook Form
- Axios
- Tailwind CSS
- React Icons
- React Hot Toast
- dnd-kit

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- dotenv
- CORS

## Application architecture

The project uses a client-server architecture:

~~~text
React Components
       |
       v
Redux Toolkit Store
       |
       v
Axios API Services
       |
       v
Express REST API
       |
       v
Controllers
       |
       v
Mongoose Models
       |
       v
MongoDB
~~~

The frontend manages the user interface and application state. The backend provides CRUD endpoints and validates prompt data before storing it in MongoDB. LocalStorage is used to restore prompt state and theme preferences between reloads.

## Project structure

~~~text
ai-prompt-library/
|
|-- client/
|   |-- public/
|   |-- src/
|       |-- components/
|       |   |-- layout/
|       |   |-- prompts/
|       |-- features/
|       |   |-- prompts/
|       |-- hooks/
|       |-- pages/
|       |-- services/
|       |-- store/
|       |-- types/
|       |-- utils/
|       |-- App.tsx
|       |-- main.tsx
|       |-- index.css
|   |-- package.json
|   |-- vite.config.ts
|
|-- server/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- server.js
|   |-- package.json
|
|-- README.md
~~~

## Requirements

Before running the project, install:

- Node.js 18 or later
- npm
- MongoDB locally or a MongoDB Atlas account
- Git

## Installation

Clone the repository:

~~~bash
git clone https://github.com/rushikesh-auti/ai-prompt-library.git
cd ai-prompt-library
~~~

Install backend dependencies:

~~~bash
cd server
npm install
~~~

Install frontend dependencies:

~~~bash
cd ../client
npm install
~~~

## Environment configuration

Create server/.env:

~~~env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ai-prompt-library
~~~

For MongoDB Atlas, replace MONGO_URI with the Atlas connection string.

Create client/.env:

~~~env
VITE_API_URL=http://localhost:5000/api
~~~

Environment files contain private configuration and should not be committed to the repository.

## Running the application

Start the backend:

~~~bash
cd server
npm run dev
~~~

Start the frontend in a second terminal:

~~~bash
cd client
npm run dev
~~~

The frontend normally runs at:

~~~text
http://localhost:5173
~~~

The backend normally runs at:

~~~text
http://localhost:5000
~~~

The backend health check is available at:

~~~text
http://localhost:5000/
~~~

## Available scripts

### Client scripts

~~~bash
npm run dev       # Start the Vite development server
npm run build     # Type-check and build the application
npm run lint      # Run ESLint
npm run preview   # Preview the production build
~~~

### Server scripts

~~~bash
npm start         # Start the backend server
npm run dev       # Start the backend with Nodemon
~~~

## REST API

Base URL:

~~~text
http://localhost:5000/api
~~~

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | /prompts | Fetch all prompts |
| GET | /prompts/:id | Fetch one prompt |
| POST | /prompts | Create a prompt |
| PUT | /prompts/:id | Update a prompt |
| DELETE | /prompts/:id | Delete a prompt |

The frontend uses these endpoints for fetching, creating, editing, deleting, pinning, and favoriting prompts. Redux state is synchronized to LocalStorage after prompt changes, imports, and fetches.

### Create prompt request

Endpoint:

~~~text
POST /api/prompts
~~~

Request body:

~~~json
{
  "title": "React Code Review",
  "content": "Review this React code and suggest improvements.",
  "category": "Coding",
  "tags": ["react", "javascript", "review"],
  "description": "Prompt for reviewing React code."
}
~~~

## Validation and error handling

The backend validates prompt data using Mongoose:

- Title is required and must be between 3 and 100 characters
- Prompt content is required and must contain at least 10 characters
- Category must be one of the supported categories
- Description cannot exceed 300 characters
- Invalid prompt IDs return a client error
- Missing prompts return a not-found response

The frontend handles loading states, API failures, form errors, invalid imports, clipboard failures, and delete confirmation.

## Performance considerations

- useMemo is used for filtered, sorted, and dashboard data
- Redux Toolkit provides predictable state updates
- Reusable components reduce duplicated UI logic
- API communication is centralized in service modules
- TypeScript provides type safety across the frontend
- LocalStorage enables fast state restoration after reloads

## Assessment coverage

This project demonstrates:

- React functional components and Hooks
- TypeScript
- Custom Hooks
- Redux Toolkit
- Reusable component architecture
- Responsive design
- Form handling and validation
- CRUD operations
- REST API integration
- MongoDB and Mongoose
- LocalStorage
- Import and export validation
- Clipboard API integration
- Drag-and-drop interaction
- Search, filters, and sorting
- Loading and error states
- Performance optimization

## Repository and deployment

- GitHub repository: https://github.com/rushikesh-auti/ai-prompt-library
- Live demo: https://my-ai-prompt-library.vercel.app

## Author

Rushikesh Auti

GitHub: https://github.com/rushikesh-auti

LinkedIn: https://linkedin.com/in/rushikesh-auti

