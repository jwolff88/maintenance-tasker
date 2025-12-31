# Maintenance Tasker: Product Requirements Document

## 1. Project Overview
Maintenance Tasker is a professional-grade application designed for facility managers and technicians to coordinate, track, and document maintenance activities. The system prioritizes accountability via user authentication and visual proof via photo documentation.

## 2. Core Features

### A. Authentication & User Roles
* **Secure Login:** Email/Password authentication.
* **Role-Based Access:** * **Admins:** Create assets, assign tasks, and view analytics.
    * **Technicians:** View assigned tasks, update status, and upload completion photos.

### B. Asset Management
* **Asset Registry:** Detailed list of machinery/facilities.
* **QR/ID Assignment:** Each asset has a unique ID for future QR integration.
* **Service History:** A dedicated tab for each asset showing every task ever performed on it.

### C. Task & Workflow Logic
* **Task Lifecycle:** `Open` -> `In Progress` -> `Under Review` -> `Completed`.
* **Priority Matrix:** Low, Medium, High, and Critical.
* **Photo Evidence:** Requirement for technicians to upload a "Before" and "After" photo for Critical tasks.

### D. Automated Scheduling
* **Recurring Engine:** Support for intervals (e.g., "Every 30 days" or "Every 1st of the month").
* **Overdue Alerts:** Visual highlighting of tasks past their `due_date`.

## 3. Technical Stack (Recommended)
* **Framework:** Next.js 14+ (App Router)
* **Styling:** Tailwind CSS + Shadcn/UI (for professional components)
* **Database:** PostgreSQL (via Supabase or Prisma)
* **Storage:** Supabase Storage or AWS S3 (for maintenance photos)
* **Auth:** NextAuth.js or Supabase Auth

## 4. Data Models

### User
| Field | Type | Note |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `email` | String | Unique |
| `role` | Enum | ADMIN, TECH |

### Asset
| Field | Type | Note |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | e.g., "Generator 04" |
| `category` | String | e.g., "Electrical" |

### Task
| Field | Type | Note |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `title` | String | Task summary |
| `assetId` | UUID | Link to Asset |
| `assignedTo` | UUID | Link to User |
| `status` | Enum | Current stage |
| `photoBefore`| URL | Optional image link |
| `photoAfter` | URL | Optional image link |

## 5. UI/UX Requirements
* **Dashboard:** High-level cards showing "Total Open Tasks" and "Assets Needing Attention."
* **Task Card:** Quick-action buttons to "Start Task" or "Mark Done" without opening a full page.
* **Responsive:** Fully functional on mobile browsers for on-site technicians.

## 6. Development Instructions for Claude
1.  **Initialize:** Create the Next.js project and install dependencies (Tailwind, Lucide-react, Shadcn).
2.  **Schema:** Generate the database schema based on Section 4.
3.  **Layout:** Build a sidebar-based layout with a mobile-responsive header.
4.  **Feature Build:** Start with Asset CRUD, then Task Management, then Photo integration.