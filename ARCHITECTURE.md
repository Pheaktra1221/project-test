# System Architecture & Data Flow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Browser (Client)                      │
│  http://localhost:5173                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Vue.js 3 Frontend Application                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              StudentForm.vue                         │   │
│  │  - Student list & pagination                        │   │
│  │  - Add/Edit student form                            │   │
│  │  - Cascading address selects                        │   │
│  │  - Image upload UI                                  │   │
│  │  - Search & filter                                  │   │
│  │  - Export/Print                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Other Components: LoginForm, Dashboard             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Styling: Tailwind CSS v3.4.19                              │
│  Build Tool: Vite                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST API Calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Express.js Backend Server                         │
│  http://localhost:3001                                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         API Routes                                 │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  POST   /api/login              ← LoginForm        │    │
│  │  POST   /api/register           ← LoginForm        │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  GET    /api/students           ← StudentForm      │    │
│  │  GET    /api/students/:id                          │    │
│  │  POST   /api/students                              │    │
│  │  PUT    /api/students/:id                          │    │
│  │  DELETE /api/students/:id                          │    │
│  │  GET    /api/students-id/next                      │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  GET    /api/address/provinces                     │    │
│  │  GET    /api/address/districts/:id                 │    │
│  │  GET    /api/address/communes/:id                  │    │
│  │  GET    /api/address/villages/:id                  │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  GET    /api/master/classes                        │    │
│  │  GET    /api/master/jobs                           │    │
│  │  GET    /api/master/schools                        │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  POST   /api/upload  (multipart/form-data)         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Middleware:                                                │
│  - CORS enabled                                             │
│  - Body Parser (50MB limit)                                │
│  - Connection pooling (10 connections)                      │
└─────────┬──────────────────┬──────────────────┬─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
    TiDB Database      Google Drive        File System
    (MySQL)            API v3              (Temp uploads)
```

## Component Hierarchy

```
App.vue (Main Container)
├── LoginForm.vue (Authentication)
├── Dashboard.vue (Welcome Screen)
└── StudentForm.vue (Student Management) ✅ NEW
    ├── Student List Section
    │   ├── Search Bar
    │   ├── Control Buttons
    │   └── Data Table
    │       └── Pagination Controls
    └── Student Detail Modal
        ├── Personal Info Section
        ├── Address Section (Birth)
        ├── Address Section (Current)
        ├── Family Info Section
        └── Image Upload Section
```

## Database Schema

```
┌──────────────────────────────────────────┐
│            TiDB Cloud Database           │
│     (gateway01.ap-southeast-1.prod...)   │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         student TABLE              │  │
│  │ ┌──────────────────────────────┐   │  │
│  │ │ studentid (PK)               │   │  │
│  │ │ StudentFirstname             │   │  │
│  │ │ StudentLastname              │   │  │
│  │ │ studentsex                   │   │  │
│  │ │ classid (FK→class)           │   │  │
│  │ │ studentbirthdate             │   │  │
│  │ │ studentage                   │   │  │
│  │ │ Birth Address IDs (FK)       │   │  │
│  │ │ Current Address IDs (FK)     │   │  │
│  │ │ StudentFathername            │   │  │
│  │ │ StudentMothername            │   │  │
│  │ │ Father/Mother Phone & Job    │   │  │
│  │ │ fromschool                   │   │  │
│  │ │ StudentPicture (URL)         │   │  │
│  │ │ created_at, updated_at       │   │  │
│  │ └──────────────────────────────┘   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │        class TABLE                 │  │
│  │ ├─ classid (PK)                    │  │
│  │ ├─ classname                       │  │
│  │ └─ classletter                     │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │    provinces TABLE                 │  │
│  │ ├─ id (PK)                         │  │
│  │ └─ name_kh                         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │    districts TABLE                 │  │
│  │ ├─ id (PK)                         │  │
│  │ ├─ province_id (FK)                │  │
│  │ └─ name_kh                         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │    communes TABLE                  │  │
│  │ ├─ id (PK)                         │  │
│  │ ├─ district_id (FK)                │  │
│  │ └─ name_kh                         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │    villages TABLE                  │  │
│  │ ├─ id (PK)                         │  │
│  │ ├─ commune_id (FK)                 │  │
│  │ └─ name_kh                         │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │      user TABLE                    │  │
│  │ ├─ ID (PK)                         │  │
│  │ ├─ Username                        │  │
│  │ ├─ Password                        │  │
│  │ ├─ Role                            │  │
│  │ ├─ create_date                     │  │
│  │ └─ login_date                      │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Data Flow: Adding a Student

```
User Form Input
    │
    ▼
StudentForm.vue - Collect all 23 fields
    │
    ├─ Auto-fill Student ID from /api/students-id/next
    │
    ├─ Validate form fields
    │
    ▼
POST /api/students
    │
    ▼
server/routes/students.js
    │
    ├─ Validate duplicate ID
    │
    ├─ Insert into database
    │
    ▼
TiDB Database (student table)
    │
    ▼
Return success response
    │
    ▼
Reload student list
    │
    ▼
Display confirmation message
```

## Data Flow: Uploading Student Picture

```
User Selects Image File
    │
    ▼
StudentForm.vue - handleImageUpload()
    │
    ▼
POST /api/upload (FormData)
    │
    ├─ image file (multipart)
    └─ studentId
    │
    ▼
server/routes/upload.js
    │
    ├─ Multer stores temp file
    │
    ├─ Google Drive API
    │   └─ Upload to GOOGLE_DRIVE_FOLDER_ID
    │
    ├─ Generate direct link
    │   └─ https://drive.google.com/uc?id={fileId}
    │
    ├─ Update database
    │   └─ student.StudentPicture = imageUrl
    │
    ├─ Delete temp file
    │
    ▼
Return imageUrl
    │
    ▼
StudentForm.vue - Display image preview
```

## Data Flow: Address Cascading

```
User Selects Province
    │
    ▼
GET /api/address/districts/{provinceId}
    │
    ▼
Load Districts
    │
    ▼
User Selects District
    │
    ▼
GET /api/address/communes/{districtId}
    │
    ▼
Load Communes
    │
    ▼
User Selects Commune
    │
    ▼
GET /api/address/villages/{communeId}
    │
    ▼
Load Villages
    │
    ▼
User Selects Village ✓
```

## Request/Response Example

### Adding Student
```
REQUEST:
POST /api/students
Content-Type: application/json

{
  "studentid": 1001,
  "StudentFirstname": "សន",
  "StudentLastname": "ពលឹង",
  "studentsex": "m",
  "classid": 1,
  "studentbirthdate": "2008-05-15",
  "studentage": 16,
  "studentbirthprovince": 1,
  "studentbirthdistrict": 10,
  "studentbirthcommune": 100,
  "studentbirthvillage": 1001,
  "studentcurrentprovince": 1,
  "studentcurrentdistrict": 10,
  "studentcurrentcommune": 100,
  "studentcurrentvillage": 1001,
  "StudentFathername": "ពលឹង ផល",
  "StudentMothername": "ផល ប្រិយ",
  "studentfathernumber": "0123456789",
  "studentmothernumber": "0987654321",
  "studentfatherjob": "គ្រូ",
  "studentmotherjob": "កសិករ",
  "fromschool": "សាលាបឋមសិក្សា អ"
}

RESPONSE:
200 OK
{
  "success": true,
  "message": "Student created successfully",
  "studentid": 1001
}
```

### Uploading Image
```
REQUEST:
POST /api/upload
Content-Type: multipart/form-data

[binary image data]
studentId: 1001

RESPONSE:
200 OK
{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "https://drive.google.com/uc?id=abc123...",
  "fileId": "abc123..."
}
```

## File Structure

```
School Project/
├── src/
│   ├── components/
│   │   ├── StudentForm.vue          [NEW] 550+ lines
│   │   ├── LoginForm.vue            [UPDATED]
│   │   ├── Dashboard.vue            [UPDATED]
│   │   └── HelloWorld.vue           [Existing]
│   ├── App.vue                      [UPDATED]
│   ├── main.js
│   ├── style.css
│   └── assets/
│
├── server/
│   ├── routes/
│   │   ├── students.js              [NEW] CRUD API
│   │   ├── address.js               [NEW] Address hierarchy
│   │   ├── master.js                [NEW] Master data
│   │   └── upload.js                [NEW] Google Drive upload
│   └── ...
│
├── public/
├── node_modules/
├── .env                             [NEEDS CONFIG]
├── .env.example                     [NEW]
├── server.js                        [UPDATED]
├── package.json                     [UPDATED]
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── QUICKSTART.md                    [NEW]
├── SETUP.md                         [NEW]
├── IMPLEMENTATION_SUMMARY.md        [NEW]
├── ARCHITECTURE.md                  [NEW - This file]
└── README.md
```

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Vue.js | 3.5.24 |
| **Styling** | Tailwind CSS | 3.4.19 |
| **Build Tool** | Vite | 7.2.5 |
| **Backend** | Express.js | 5.2.1 |
| **Database** | TiDB Cloud (MySQL) | MySQL 2 driver 3.16.1 |
| **File Upload** | Multer | 1.4.5-lts.1 |
| **Cloud Storage** | Google Drive API | v3 |
| **Authentication** | Custom (TiDB) | N/A |

## Security Considerations

- ✅ CORS enabled for frontend communication
- ✅ Body parser limits prevent large uploads
- ⚠️ TODO: Add input sanitization
- ⚠️ TODO: Add rate limiting
- ⚠️ TODO: Add authentication middleware for API routes
- ⚠️ TODO: Hash passwords in database
- ⚠️ TODO: Add HTTPS in production

## Performance Metrics

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Page Load | < 2s | ✅ Optimized Vite build |
| Search Response | < 500ms | ✅ Efficient SQL queries |
| Image Upload | < 5s | ✅ Multer + Google Drive |
| Pagination | Instant | ✅ Server-side pagination |
| Database Connections | Pooled | ✅ Connection pool (10) |

## Deployment Architecture (Future)

```
                    Internet
                       │
                       ▼
                   ┌────────┐
                   │ Vite   │ (Static CDN)
                   │ Build  │ Frontend
                   └────────┘
                       │
                       │
                   ┌────────┐
                   │ Node.js│ (Cloud Server)
                   │Server  │ Express.js
                   └────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
        ┌────────┐         ┌──────────┐
        │ TiDB   │         │ Google   │
        │ Cloud  │         │ Drive    │
        │Database│         │ API      │
        └────────┘         └──────────┘
```

---

This architecture provides a scalable, modular foundation for the student management system with clear separation of concerns and well-defined API boundaries.
