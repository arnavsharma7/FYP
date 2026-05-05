# Nepal Heritage Trails

A comprehensive platform connecting tourists with authentic Nepali heritage experiences, cultural homestays, and AI-generated personalized travel itineraries. Built with modern web technologies to preserve and promote Nepal's rich cultural heritage while supporting local communities.

## 🏗️ Architecture Overview

This project consists of four main components:
- **Frontend**: Next.js React application with TypeScript and Tailwind CSS
- **Backend**: Express.js REST API with PostgreSQL + PostGIS
- **AI Service**: Machine learning models for itinerary generation
- **Database**: PostgreSQL with PostGIS for geospatial data

## 📁 Project Structure

```
nepal-heritage-trails/
├── ai-service/                 # AI/ML service for itinerary generation
│   └── models/                 # Machine learning models and data
├── backend/                    # Express.js REST API server
│   ├── package.json            # Backend dependencies and scripts
│   ├── package-lock.json       # Lockfile for backend dependencies
│   └── src/
│       ├── server.js           # Main Express server setup
│       ├── config/             # Database and service configurations
│       ├── controllers/        # Business logic controllers
│       ├── middleware/
│       │   └── auth.js         # Authentication middleware
│       ├── models/
│       │   └── seedData.js     # Database seed data
│       └── routes/             # API route handlers
│           ├── auth.js         # Authentication routes
│           ├── bookings.js     # Booking management routes
│           ├── experiences.js  # Experience CRUD routes
│           ├── impact.js       # Community impact routes
│           ├── trails.js       # Trail itinerary routes
│           └── users.js        # User management routes
├── database/
│   └── schema.sql              # PostgreSQL database schema with PostGIS
├── docs/                       # Documentation and project assets
└── frontend/                   # Next.js React frontend application
    ├── .gitignore              # Git ignore rules for frontend
    ├── eslint.config.mjs       # ESLint configuration
    ├── next.config.ts          # Next.js configuration
    ├── package.json            # Frontend dependencies and scripts
    ├── package-lock.json       # Lockfile for frontend dependencies
    ├── postcss.config.mjs      # PostCSS configuration for Tailwind
    ├── README.md               # Frontend-specific documentation
    ├── tsconfig.json           # TypeScript configuration
    ├── public/                 # Static assets
    │   ├── favicon.ico         # Site favicon
    │   ├── file.svg            # Generic file icon
    │   ├── globe.svg           # Globe icon for global theme
    │   ├── next.svg            # Next.js logo
    │   └── vercel.svg          # Vercel deployment icon
    └── src/
        ├── app/                # Next.js App Router pages
        │   ├── favicon.ico     # App favicon
        │   ├── globals.css     # Global CSS with Tailwind and custom styles
        │   ├── layout.tsx      # Root layout component
        │   ├── page.tsx        # Homepage component
        │   ├── admin/
        │   │   └── page.tsx    # Admin dashboard page
        │   ├── dashboard/
        │   │   └── page.tsx    # User dashboard page
        │   ├── experience/
        │   │   └── [id]/
        │   │       └── page.tsx # Individual experience detail page
        │   ├── impact/
        │   │   └── page.tsx    # Community impact page
        │   ├── marketplace/
        │   │   └── page.tsx    # Experience marketplace page
        │   ├── provider/
        │   │   └── page.tsx    # Service provider dashboard
        │   └── trail-builder/
        │       └── page.tsx    # AI-powered trail builder page
        ├── components/         # Reusable React components
        │   ├── layout/
        │   │   ├── Footer.tsx  # Site footer component
        │   │   └── Navbar.tsx  # Navigation bar component
        │   ├── map/
        │   │   └── InteractiveMap.tsx # Interactive map component
        │   ├── three/
        │   │   └── HeritageViewer.tsx # 3D heritage viewer component
        │   └── ui/             # UI component library (if any)
        └── lib/                # Utility libraries and configurations
            ├── api.ts          # API client and utilities
            └── fallbackData.ts # Fallback data for development
```

## 📄 File Descriptions

### Backend Files

- **server.js**: Main Express server file that sets up middleware, routes, and error handling. Includes CORS, helmet security, rate limiting, and health check endpoint.

- **routes/auth.js**: Handles user authentication including login, registration, JWT token management, and Google OAuth integration.

- **routes/experiences.js**: CRUD operations for cultural experiences, including filtering by category, location, and provider.

- **routes/trails.js**: Manages AI-generated travel itineraries, including creation, modification, and booking.

- **routes/bookings.js**: Handles booking lifecycle from creation to completion, including payment processing.

- **routes/impact.js**: Tracks and reports community impact metrics, revenue sharing, and cultural preservation efforts.

- **routes/users.js**: User profile management, role-based access control, and user data operations.

- **middleware/auth.js**: JWT authentication middleware for protecting routes and verifying user permissions.

- **models/seedData.js**: Sample data for populating the database during development and testing.

### Frontend Files

- **layout.tsx**: Root layout with navigation, footer, and global providers.

- **page.tsx**: Homepage featuring hero section, featured experiences, and trail previews.

- **globals.css**: Global styles with Tailwind CSS imports, custom design system variables, and Nepali heritage-themed styling.

- **api.ts**: Axios-based API client with interceptors for authentication and error handling.

- **fallbackData.ts**: Static data for development when backend is unavailable.

- **InteractiveMap.tsx**: Map component using Mapbox or similar for displaying experience locations.

- **HeritageViewer.tsx**: Three.js component for 3D visualization of heritage sites.

### Database Files

- **schema.sql**: Complete PostgreSQL schema with PostGIS extensions, including all tables, indexes, triggers, and relationships.

## 🗄️ Database Schema (ER Diagram)

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │   experiences   │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────┤ id (PK)         │
│ email           │       │ provider_id (FK)│
│ password_hash   │       │ title           │
│ full_name       │       │ description     │
│ role            │       │ category        │
│ avatar_url      │       │ price_per_person│
│ phone           │       │ location_point  │
│ bio             │       │ images          │
│ location        │       │ amenities       │
│ google_id       │       │ languages       │
│ is_verified     │       │ avg_rating      │
│ is_active       │       │ total_reviews   │
│ created_at      │       │ community_impact│
│ updated_at      │       └─────────────────┘
└─────────────────┘               │
          │                       │
          │                       │
          ▼                       ▼
┌─────────────────┐       ┌─────────────────┐
│    bookings     │       │    reviews      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │──────►│ user_id (FK)    │
│ experience_id   │◄──────┤ experience_id   │
│ trail_id        │       │ rating          │
│ booking_date    │       │ title           │
│ num_guests      │       │ comment         │
│ total_amount    │       │ images          │
│ status          │       │ is_verified     │
│ special_requests│       │ created_at      │
│ created_at      │       └─────────────────┘
│ updated_at      │               │
└─────────────────┘               │
          │                       │
          ▼                       ▼
┌─────────────────┐       ┌─────────────────┐
│    payments     │       │community_impact │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ booking_id (FK) │◄──────┤ experience_id   │
│ amount          │       │ provider_id     │
│ method          │       │ district        │
│ status          │       │ families_supported│
│ transaction_id  │       │ revenue_generated│
│ gateway_response│       │ community_share  │
│ paid_at         │       │ programs_funded  │
│ created_at      │       │ artisans_employed│
└─────────────────┘       │ sites_maintained │
                          │ reporting_period │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│     trails      │       │   trail_days    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────┤ id (PK)         │
│ creator_id (FK) │       │ trail_id (FK)   │
│ title           │       │ day_number      │
│ description     │       │ title           │
│ difficulty      │       │ description     │
│ duration_days   │       │ location_point  │
│ total_cost      │       │ experience_id   │
│ interests       │       │ estimated_cost  │
│ is_featured     │       │ travel_time     │
│ is_public       │       │ notes           │
│ total_bookings  │       └─────────────────┘
│ avg_rating      │
│ created_at      │
│ updated_at      │
└─────────────────┘

┌─────────────────┐
│saved_experiences│
├─────────────────┤
│ user_id (FK)    │
│ experience_id   │
│ created_at      │
└─────────────────┘
```

### Key Relationships:
- Users can be tourists, providers, or admins
- Providers create experiences and trails
- Experiences belong to providers and have reviews
- Trails consist of multiple trail_days, each optionally linked to an experience
- Bookings can be for individual experiences or entire trails
- Payments are linked to bookings
- Community impact tracks social benefits of experiences
- Users can save experiences to wishlists

## 🎨 Wireframes

### Homepage
```
┌─────────────────────────────────────────────────────────────┐
│ [Navbar: Logo | Nav Links | Login/Signup]                   │
├─────────────────────────────────────────────────────────────┤
│ Hero Section                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  Discover Nepal's Hidden Heritage Treasures            │ │
│ │  [Search Bar] [Explore Button]                          │ │
│ │  [Hero Image with Mandala Pattern]                      │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Featured Experiences                                        │
│ [Experience Card 1] [Experience Card 2] [Experience Card 3] │
├─────────────────────────────────────────────────────────────┤
│ AI Trail Builder                                            │
│ [Interactive Form: Interests, Duration, Budget]            │
│ [Generate Trail Button]                                     │
├─────────────────────────────────────────────────────────────┤
│ Community Impact                                            │
│ [Impact Stats: Families Supported, Revenue Generated]      │
├─────────────────────────────────────────────────────────────┤
│ [Footer: Links | Social Media | Contact]                    │
└─────────────────────────────────────────────────────────────┘
```

### Experience Detail Page
```
┌─────────────────────────────────────────────────────────────┐
│ [Navbar]                                                    │
├─────────────────┬───────────────────────────────────────────┤
│ Experience      │ [Image Gallery]                           │
│ Images          │ [360° View Button]                        │
│ [Thumbnails]    │                                           │
├─────────────────┼───────────────────────────────────────────┤
│ Details         │ Title: [Experience Title]                 │
│                 │ Rating: ⭐⭐⭐⭐⭐ (4.8)                      │
│                 │ Price: NPR 2,500 per person               │
│                 │ Duration: 3 hours                         │
│                 │ Location: [Map with Pin]                  │
│                 │ Amenities: [Icons]                        │
│                 │ Description: [Text]                       │
├─────────────────┼───────────────────────────────────────────┤
│ Reviews         │ [Review 1] [Review 2] [Review 3]          │
│                 │ [Write Review Button]                     │
├─────────────────┼───────────────────────────────────────────┤
│ Booking         │ [Date Picker] [Guests Selector]           │
│                 │ [Special Requests Textarea]               │
│                 │ [Book Now Button]                         │
└─────────────────┴───────────────────────────────────────────┘
```

### Trail Builder
```
┌─────────────────────────────────────────────────────────────┐
│ [Navbar]                                                    │
├─────────────────────────────────────────────────────────────┤
│ AI Trail Builder                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Interests: [Culture] [Adventure] [Nature] [History]    │ │
│ │ Duration: [3] [5] [7] [10] days                         │ │
│ │ Budget: [Low] [Medium] [High]                          │ │
│ │ Travel Style: [Relaxed] [Moderate] [Intense]           │ │
│ │ [Generate Trail Button]                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Generated Itinerary                                         │
│ Day 1: Kathmandu Heritage Circuit                           │
│   - Morning: Swayambhunath Stupa                            │
│   - Afternoon: Boudhanath Stupa                             │
│   - Evening: Cultural Dinner                                │
│ [Map View] [Day Details] [Modify Button]                    │
├─────────────────────────────────────────────────────────────┤
│ [Save Trail] [Book Entire Trail] [Share Button]             │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ [Navbar]                                                    │
├─────────────┬───────────────────────────────────────────────┤
│ Menu        │ My Bookings                                    │
│ - Profile   │ ┌───────────────────────────────────────────┐ │
│ - Bookings  │ │ Upcoming: [Booking 1] [Booking 2]        │ │
│ - Wishlist  │ │ Past: [Booking 3] [Booking 4]            │ │
│ - Reviews   │ └───────────────────────────────────────────┘ │
│ - Settings  │                                               │
├─────────────┼───────────────────────────────────────────────┤
│             │ My Reviews                                     │
│             │ [Review Card 1] [Review Card 2]               │
├─────────────┼───────────────────────────────────────────────┤
│             │ Wishlist                                       │
│             │ [Experience 1] [Experience 2] [Experience 3]  │
└─────────────┴───────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with PostGIS
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nepal-heritage-trails
   ```

2. **Set up the database**
   ```bash
   createdb nepal_heritage_trails
   psql -d nepal_heritage_trails -f database/schema.sql
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Set up environment variables**
   Create `.env` files in backend and frontend directories with necessary configurations.

6. **Start the services**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🛠️ Technologies Used

### Frontend
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS v4**: Utility-first CSS framework
- **React**: UI library
- **Three.js**: 3D graphics for heritage visualization

### Backend
- **Express.js**: Web framework for Node.js
- **PostgreSQL + PostGIS**: Spatial database
- **JWT**: Authentication
- **bcrypt**: Password hashing

### AI Service
- **Python**: Machine learning framework
- **TensorFlow/PyTorch**: ML libraries (planned)

### DevOps
- **Docker**: Containerization (planned)
- **Vercel**: Frontend deployment
- **Railway/Render**: Backend deployment

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/me` - Get current user

### Experiences
- `GET /api/experiences` - List experiences with filters
- `GET /api/experiences/:id` - Get experience details
- `POST /api/experiences` - Create experience (providers)
- `PUT /api/experiences/:id` - Update experience
- `DELETE /api/experiences/:id` - Delete experience

### Trails
- `GET /api/trails` - List trails
- `GET /api/trails/:id` - Get trail details
- `POST /api/trails` - Create trail
- `PUT /api/trails/:id` - Update trail

### Bookings
- `GET /api/bookings` - User's bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking status

### Community Impact
- `GET /api/impact` - Impact statistics
- `GET /api/impact/:experienceId` - Experience impact

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Nepal Tourism Board for cultural insights
- Local communities for preserving heritage
- Open source contributors

<<<<<<< HEAD

Built with ❤️ for Nepal's cultural heritage preservation and community empowerment.
=======
---

Built with ❤️ for Nepal's cultural heritage preservation and community empowerment.
>>>>>>> b60848b (all commit)
