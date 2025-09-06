# Cudliy 3D Printing Design Platform

A modern web application for AI-powered 3D design generation and 3D model conversion. The platform allows users to create custom designs through an intuitive interface and convert them into 3D printable models.

## 🚀 Features

- **AI Image Generation**: Create custom designs using AI with various style options
- **3D Model Conversion**: Convert 2D images to 3D printable models
- **Advanced Design Options**: Color, size, style, material, and production method selection
- **Real-time Processing**: Live status updates for generation progress
- **File Management**: Upload, download, and manage design files
- **User Sessions**: Track design creation workflow
- **Responsive UI**: Modern, intuitive interface with smooth animations

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Routing**: React Router DOM
- **UI Components**: Custom components with smooth animations

### Backend (Node.js + Express + ES Modules)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Module System**: ES Modules (ESM)
- **Database**: MongoDB with Mongoose
- **File Storage**: Google Cloud Storage
- **AI Services**: OpenAI GPT-4, Replicate API
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston

## 📁 Project Structure

```
cudliy-design-platform/
├── backend/                          # Backend API server
│   ├── src/
│   │   ├── config/                   # Configuration files
│   │   │   └── database.js           # MongoDB connection
│   │   ├── controllers/              # Route controllers
│   │   │   ├── designController.js   # Design-related operations
│   │   │   ├── sessionController.js  # Session management
│   │   │   └── uploadController.js   # File upload handling
│   │   ├── middleware/               # Express middleware
│   │   │   └── auth.js               # Authentication middleware
│   │   ├── models/                   # MongoDB models
│   │   │   ├── User.js               # User model
│   │   │   ├── Design.js             # Design model
│   │   │   └── Session.js            # Session model
│   │   ├── routes/                   # API routes
│   │   │   ├── designRoutes.js       # Design endpoints
│   │   │   ├── uploadRoutes.js       # Upload endpoints
│   │   │   └── sessionRoutes.js      # Session endpoints
│   │   ├── services/                 # Business logic services
│   │   │   ├── aiService.js          # AI integration
│   │   │   └── storageService.js     # File storage
│   │   ├── utils/                    # Utility functions
│   │   │   ├── errorHandler.js       # Error handling
│   │   │   ├── logger.js             # Logging configuration
│   │   │   ├── rateLimiter.js        # Rate limiting
│   │   │   └── validation.js         # Request validation
│   │   └── server.js                 # Main server file
│   ├── index.js                      # Entry point
│   ├── package.json                  # Backend dependencies
│   └── .env                          # Environment variables
├── src/                              # Frontend React app
│   ├── components/                   # React components
│   │   ├── ColorPicker.tsx           # Color selection
│   │   ├── DetailSelector.tsx        # Detail options
│   │   ├── MaterialSelector.tsx      # Material selection
│   │   ├── ProductionSelector.tsx    # Production method
│   │   ├── SizeSelector.tsx          # Size selection
│   │   └── StyleSelector.tsx         # Style selection
│   ├── pages/                        # Page components
│   │   ├── DesignPage.tsx            # Main design interface
│   │   └── AdvancedDesignPage.tsx    # Advanced mode
│   ├── services/                     # API services
│   │   └── api.ts                    # Backend API client
│   ├── App.tsx                       # Main app component
│   ├── main.tsx                      # App entry point
│   └── index.css                     # Global styles
├── public/                           # Static assets
├── package.json                      # Frontend dependencies
├── vite.config.ts                    # Vite configuration
├── tailwind.config.js                # Tailwind configuration
└── README.md                         # This file
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- MongoDB
- Google Cloud Storage account
- OpenAI API key
- Replicate API token

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**:
   ```env
   NODE_ENV=development
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/cudliy
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
   GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json
   OPENAI_API_KEY=your-openai-key
   REPLICATE_API_TOKEN=your-replicate-token
   JWT_SECRET=your-jwt-secret
   ALLOWED_ORIGINS=http://localhost:3000
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to project root**:
   ```bash
   cd ..
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

## 🔧 API Endpoints

### Design Management
- `POST /api/designs/generate-images` - Generate AI images from specifications
- `POST /api/designs/generate-3d-model` - Convert image to 3D model
- `GET /api/designs/:designId` - Get design details
- `GET /api/designs/user/:userId/designs` - Get user's designs
- `DELETE /api/designs/:designId` - Delete design
- `PATCH /api/designs/:designId` - Update design metadata

### File Upload
- `POST /api/upload/image` - Upload custom image

### Session Management
- `GET /api/session/:sessionId` - Get session status

### Health Check
- `GET /api/health` - Server health status

## 🎨 Design Workflow

1. **Text Input**: User enters design description
2. **Style Selection**: Choose color, size, style, material, production method
3. **AI Generation**: System generates enhanced prompt and creates image variations
4. **Image Selection**: User selects preferred image
5. **3D Conversion**: Selected image is converted to 3D model
6. **Download**: User can download 3D model files

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configured for specific origins
- **Helmet Security**: HTTP security headers
- **File Type Validation**: Restricted file uploads
- **Error Handling**: Comprehensive error management

## 📊 Monitoring & Logging

- **Winston Logger**: Structured logging with file rotation
- **Request Logging**: Morgan HTTP request logging
- **Error Tracking**: Detailed error logging with stack traces
- **Performance Monitoring**: Request timing and response tracking

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Build and start the server:
   ```bash
   npm start
   ```

### Frontend Deployment
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Cudliy Team** - Building the future of 3D design creation
