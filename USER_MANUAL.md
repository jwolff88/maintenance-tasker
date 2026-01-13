# Maintenance Tasker
## User Manual & Feature Guide

**Version 1.0**
**January 2026**

---

# Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Properties Management](#3-properties-management)
4. [Assets & Equipment](#4-assets--equipment)
5. [Maintenance Tasks](#5-maintenance-tasks)
6. [Tickets & Work Orders](#6-tickets--work-orders)
7. [My Work (Technician Dashboard)](#7-my-work-technician-dashboard)
8. [Team Management & Analytics](#8-team-management--analytics)
9. [Inventory Management](#9-inventory-management)
10. [Turnovers](#10-turnovers)
11. [Capital Expenditures (CapEx)](#11-capital-expenditures-capex)
12. [Leases & Tenants](#12-leases--tenants)
13. [Vendors](#13-vendors)
14. [Inspections](#14-inspections)
15. [Settings & Administration](#15-settings--administration)
16. [Tenant Portal](#16-tenant-portal)
17. [Billing & Subscriptions](#17-billing--subscriptions)

---

# 1. Getting Started

## 1.1 Creating an Account

1. Navigate to the Maintenance Tasker website
2. Click **"Get Started"** or **"Register"**
3. Fill in your company information:
   - Company name
   - Your email address
   - Your name
   - Password
4. Click **"Create Account"**
5. You'll start with a 14-day free trial

## 1.2 Logging In

1. Go to the login page
2. Enter your email and password
3. Click **"Sign In"**
4. You'll be directed to your dashboard

## 1.3 User Roles

| Role | Permissions |
|------|-------------|
| **Company Admin** | Full access to all features |
| **Property Manager** | Manage assigned properties, create tickets, view reports |
| **Maintenance Staff** | Access My Work, complete tasks, track time |
| **Vendor** | View assigned work orders, update status |
| **Read Only** | View-only access to all data |

---

# 2. Dashboard Overview

The Dashboard is your command center for property management.

## 2.1 Quick Stats
At the top of the dashboard, you'll see:
- **Total Properties** - Number of properties you manage
- **Open Tickets** - Maintenance requests awaiting attention
- **Active Tasks** - Tasks currently in progress
- **Upcoming Inspections** - Scheduled property inspections

## 2.2 Activity Feed
The activity feed shows recent actions:
- New tickets created
- Tasks completed
- Status changes
- Comments added

## 2.3 Property Health Overview
Color-coded property status:
- **Green (Healthy)** - No issues
- **Yellow (Attention Needed)** - Minor issues pending
- **Red (Critical)** - Urgent issues require immediate attention

---

# 3. Properties Management

## 3.1 Viewing Properties

1. Click **"Properties"** in the sidebar
2. See a list of all your properties with:
   - Property name and address
   - Type (Single Family, Multi-Family, Commercial, etc.)
   - Status (Healthy, Attention Needed, Critical)
   - Risk score (0-100)

## 3.2 Adding a Property

1. Click **"+ Add Property"** button
2. Fill in the property details:
   - Name
   - Address, City, State, ZIP
   - Property Type
   - Number of Units
   - Square Footage
   - Year Built
3. Click **"Create Property"**

## 3.3 Property Details

Click on any property to see:
- **Overview Tab** - Basic information and status
- **Tickets** - All maintenance requests for this property
- **Leases** - Current and past leases
- **Equipment** - Installed equipment with service schedules
- **Notes** - Four types of notes:
  - Property Notes
  - Tenant Notes
  - Building Notes
  - Owner Notes
- **Inspections** - Scheduled and completed inspections
- **Activity** - Timeline of all actions

## 3.4 Property Notes

Notes help you track important information:

1. Go to a property's detail page
2. Click the **"Notes"** tab
3. Select note type (Property, Tenant, Building, or Owner)
4. Click **"Add Note"**
5. Enter your note content
6. Choose if it's internal only
7. Click **"Save"**

---

# 4. Assets & Equipment

## 4.1 What are Assets?

Assets are equipment, machinery, or items that require regular maintenance:
- HVAC systems
- Plumbing fixtures
- Electrical systems
- Appliances
- Safety equipment
- Vehicles

## 4.2 Adding an Asset

1. Click **"Assets"** in the sidebar
2. Click **"+ Add Asset"**
3. Fill in:
   - Name and Description
   - Category (HVAC, Plumbing, Electrical, etc.)
   - Location
   - Manufacturer, Model, Serial Number
   - Purchase Date and Warranty Expiry
   - Linked Property (optional)
4. Click **"Create Asset"**

## 4.3 Asset Status

- **Operational** - Working normally
- **Needs Maintenance** - Maintenance due or minor issues
- **Out of Service** - Not currently functional
- **Retired** - No longer in use

## 4.4 Asset Detail View

Click any asset to see:
- Current status and information
- Service history
- Active maintenance tasks
- QR code for quick access

---

# 5. Maintenance Tasks

## 5.1 Task Overview

Tasks are scheduled maintenance activities linked to assets.

## 5.2 Creating a Task

1. Click **"Tasks"** in the sidebar
2. Click **"+ New Task"**
3. Fill in:
   - Title and Description
   - Select Asset
   - Priority (Low, Medium, High, Critical)
   - Assignee (optional)
   - Due Date
4. For recurring tasks:
   - Check "Recurring"
   - Select frequency (Daily, Weekly, Monthly, etc.)
5. Click **"Create Task"**

## 5.3 Task Lifecycle

Tasks progress through these stages:

```
OPEN → IN PROGRESS → UNDER REVIEW → COMPLETED
```

1. **Open** - Task created, not started
2. **In Progress** - Technician is working on it
3. **Under Review** - Work done, pending approval
4. **Completed** - Task finished and approved

## 5.4 Working on Tasks

1. Find your task in the task list or My Work
2. Click **"Start"** to begin (changes to In Progress)
3. Add notes and photos as you work
4. Upload before/after photos
5. Click **"Done"** when finished (changes to Under Review)
6. Supervisor reviews and marks Complete

## 5.5 Photo Documentation

Tasks support photo evidence:
- **Before Photo** - Document the initial condition
- **After Photo** - Show completed work

To add photos:
1. Open the task
2. Click **"Upload Photo"**
3. Select the photo type
4. Choose your image file

---

# 6. Tickets & Work Orders

## 6.1 What are Tickets?

Tickets are maintenance requests, often from tenants or property managers.

## 6.2 Creating a Ticket

1. Click **"Tickets"** in the sidebar
2. Click **"+ New Ticket"**
3. Fill in:
   - Title and Description
   - Property
   - Category (Plumbing, Electrical, HVAC, etc.)
   - Priority (Low, Medium, High, Urgent)
   - Optional: Tenant, Vendor, Cost Estimate
4. Click **"Create Ticket"**

## 6.3 AI Smart Triage

When enabled, tickets are automatically analyzed by AI to:
- Suggest appropriate priority
- Recommend category
- Provide suggested fixes
- Estimate resolution time

## 6.4 Ticket Status Flow

```
NEW → IN PROGRESS → WAITING ON TENANT/VENDOR → COMPLETED
```

## 6.5 Ticket Comments

Add comments to tickets for communication:
1. Open a ticket
2. Scroll to Comments section
3. Type your message
4. Check "Internal" if only for staff
5. Click **"Add Comment"**

---

# 7. My Work (Technician Dashboard)

## 7.1 Overview

The My Work page is designed for maintenance technicians to manage their daily work.

## 7.2 Time Clock

At the top of the page:
- **Clock In** - Start your workday
- **Clock Out** - End your workday
- Displays current duration worked

## 7.3 Quick Stats

- Open Tasks assigned to you
- In Progress tasks
- Open Tickets assigned to you
- Tasks Due Today

## 7.4 Tasks Tab

View all tasks assigned to you:
- See priority and status badges
- Click **"Start"** to begin a task
- Click **"Done"** when finished
- Click task title for full details

## 7.5 Tickets Tab

View tickets assigned to you:
- See priority, status, and category
- View property location
- Click to see full ticket details

---

# 8. Team Management & Analytics

## 8.1 Overview Tab

See team-wide statistics:
- Total tasks completed
- Total hours worked
- Average tasks per technician
- Team efficiency metrics

## 8.2 Technicians Tab

View all maintenance staff:
- Name and contact info
- Skills and certifications
- Current workload
- Hourly rate (if tracked)

To edit a technician:
1. Click on their name
2. Update skills, certifications, or hourly rate
3. Save changes

## 8.3 Leaderboard

View top performers:
- Tasks completed
- Hours worked
- Efficiency rating

## 8.4 Workload Distribution

Visual chart showing:
- Tasks per technician
- Workload balance across team

## 8.5 Skills Coverage

See what skills your team has:
- List of all skills in your team
- Number of technicians per skill
- Identify skill gaps

---

# 9. Inventory Management

## 9.1 Parts Inventory

Track parts, supplies, and materials used in maintenance.

## 9.2 Adding Inventory Items

1. Click **"Inventory"** in the sidebar
2. Click **"+ Add Item"**
3. Fill in:
   - Name and Description
   - SKU (optional)
   - Category (Plumbing, Electrical, Hardware, etc.)
   - Current Quantity
   - Minimum Quantity (for alerts)
   - Unit Cost
   - Storage Location
   - Supplier Information
4. Click **"Create Item"**

## 9.3 Stock Management

**Adjusting Stock:**
1. Click on an inventory item
2. Click **"Adjust Stock"**
3. Select transaction type:
   - Restock (add inventory)
   - Used (subtract for job)
   - Adjustment (manual correction)
   - Returned
   - Damaged
4. Enter quantity and notes
5. Click **"Submit"**

## 9.4 Low Stock Alerts

Items below their minimum quantity appear with warning badges.

## 9.5 Using Parts on Tasks

When completing a task:
1. Open the task
2. Click **"Use Parts"**
3. Select inventory items used
4. Enter quantities
5. Stock is automatically deducted

---

# 10. Turnovers

## 10.1 What are Turnovers?

Turnovers track the make-ready process when a tenant moves out and a new tenant moves in.

## 10.2 Creating a Turnover

1. Click **"Turnovers"** in the sidebar
2. Click **"+ New Turnover"**
3. Fill in:
   - Property
   - Unit number (for multi-unit)
   - Move-out date
   - Target ready date
   - Move-in date (if known)
4. Click **"Create"**

## 10.3 Turnover Status

```
SCHEDULED → MOVE OUT COMPLETE → IN PROGRESS → FINAL INSPECTION → READY → OCCUPIED
```

## 10.4 Turnover Tasks

Break down work into tasks:
- Cleaning
- Painting
- Repairs
- Inspection
- Appliances
- Flooring
- Locks
- Landscaping

To add a task:
1. Open the turnover
2. Click **"+ Add Task"**
3. Fill in details
4. Assign to staff or vendor

## 10.5 Cost Tracking

Track turnover costs:
- Estimated cost per task
- Actual cost when completed
- Total turnover cost summary

---

# 11. Capital Expenditures (CapEx)

## 11.1 What is CapEx?

Capital expenditures are major property improvements or replacements:
- Roof replacement
- HVAC system upgrade
- Major renovations
- New appliances

## 11.2 Creating a CapEx Item

1. Click **"CapEx"** in the sidebar
2. Click **"+ New CapEx"**
3. Fill in:
   - Title and Description
   - Category (Roof, HVAC, Plumbing, etc.)
   - Property
   - Budget Year
   - Estimated Cost
   - Depreciation Years (optional)
4. Click **"Create"**

## 11.3 CapEx Status Flow

```
PROPOSED → PENDING APPROVAL → APPROVED → IN PROGRESS → COMPLETED
```

## 11.4 Approval Process

1. Create CapEx as PROPOSED
2. Submit for approval (PENDING APPROVAL)
3. Administrator reviews and approves
4. Work begins (IN PROGRESS)
5. Mark complete when finished

## 11.5 Budget Tracking

View CapEx by budget year:
- Total budgeted amount
- Approved amount
- Spent amount
- Remaining budget

---

# 12. Leases & Tenants

## 12.1 Managing Leases

1. Click **"Leases"** in the sidebar
2. View all leases with:
   - Tenant name
   - Property
   - Rent amount
   - Start/End dates
   - Status

## 12.2 Creating a Lease

1. Click **"+ New Lease"**
2. Select Property and Tenant (or create new tenant)
3. Enter:
   - Start and End dates
   - Rent amount
   - Security deposit
   - Special terms (optional)
4. Click **"Create Lease"**

## 12.3 Lease Status

- **Pending** - Not yet started
- **Active** - Currently in effect
- **Expired** - Past end date
- **Terminated** - Ended early

## 12.4 Renewal Probability

The system tracks renewal probability (0-100%) to help you plan for potential turnovers.

---

# 13. Vendors

## 13.1 Vendor Management

Track contractors and service providers.

## 13.2 Adding a Vendor

1. Click **"Vendors"** in the sidebar
2. Click **"+ Add Vendor"**
3. Fill in:
   - Company name
   - Contact email and phone
   - Specialties (Plumbing, HVAC, etc.)
   - License number
   - Insurance expiry date
4. Click **"Create Vendor"**

## 13.3 Vendor Ratings

Rate vendors after completing jobs:
1. Open vendor profile
2. Click **"Rate"**
3. Select star rating (1-5)
4. Rating updates automatically

## 13.4 Assigning Vendors to Tickets

When creating or editing a ticket:
1. Select vendor from dropdown
2. Vendor receives notification
3. Track vendor response time

---

# 14. Inspections

## 14.1 Inspection Types

- **City** - Municipal inspections
- **Fire** - Fire safety inspections
- **Safety** - General safety checks
- **Routine** - Regular property inspections
- **Move-In** - New tenant inspections
- **Move-Out** - Departing tenant inspections

## 14.2 Scheduling an Inspection

1. Click **"Inspections"** in the sidebar
2. Click **"+ Schedule Inspection"**
3. Select:
   - Property
   - Inspection type
   - Scheduled date
   - Notes
4. Click **"Schedule"**

## 14.3 Completing an Inspection

1. Find the inspection
2. Click to open details
3. Add:
   - Passed items
   - Failed items
   - Notes
4. Change status to Completed or Failed
5. Save

---

# 15. Settings & Administration

## 15.1 Company Settings

Access via **"Settings"** in the sidebar.

## 15.2 User Management

**Adding a User:**
1. Go to Settings
2. Click **"Users"** or **"Team"**
3. Click **"+ Add User"**
4. Enter:
   - Email
   - First and Last name
   - Role
   - Phone (optional)
5. Click **"Create"**

User receives an invitation email to set their password.

**Editing Permissions:**
1. Click on a user
2. Select **"Permissions"**
3. Toggle individual permissions
4. Save changes

## 15.3 Technician Setup

For maintenance staff:
1. Create user with **Maintenance Staff** role
2. Edit their profile to add:
   - Skills (Plumbing, HVAC, Electrical, etc.)
   - Certifications with expiry dates
   - Hourly rate
   - Max daily tasks

---

# 16. Tenant Portal

## 16.1 Overview

The Tenant Portal allows tenants to submit maintenance requests without logging in.

## 16.2 Submitting a Request (Tenant View)

1. Go to `/tenant` page
2. Enter email address to look up lease
3. Select property/unit
4. Fill in:
   - Issue title
   - Description
   - Category
   - Urgency
5. Submit request

## 16.3 Managing Tenant Requests (Staff View)

Tenant requests appear as new tickets in the Tickets section with the tenant linked.

---

# 17. Billing & Subscriptions

## 17.1 Plans

| Plan | Price | Properties | Users | Features |
|------|-------|------------|-------|----------|
| **Starter** | $49/mo | 10 | 3 | Basic features |
| **Professional** | $149/mo | 50 | 10 | Advanced analytics |
| **Enterprise** | $349/mo | Unlimited | Unlimited | Custom integrations |

## 17.2 Managing Subscription

1. Go to **Settings**
2. Click **"Billing"**
3. View current plan and usage
4. Click **"Manage Subscription"** for Stripe portal

## 17.3 Trial Period

- 14-day free trial on signup
- Limited to: 3 properties, 2 users, 25 tasks/month
- Upgrade anytime to continue using all features

---

# Support & Help

## Getting Help

- **Documentation:** This user manual
- **Support Email:** Contact your administrator
- **In-App:** Click help icon in navigation

## Reporting Issues

If you encounter a bug:
1. Note what you were doing
2. Screenshot any error messages
3. Report to your administrator or support

---

# Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Quick search |
| `Esc` | Close modal/dialog |

---

# Glossary

| Term | Definition |
|------|------------|
| **Asset** | Equipment or item requiring maintenance |
| **CapEx** | Capital Expenditure - major property improvements |
| **Task** | Scheduled maintenance activity |
| **Ticket** | Maintenance request or work order |
| **Turnover** | Make-ready process between tenants |
| **Triage** | Process of prioritizing tickets |

---

*Maintenance Tasker User Manual v1.0*
*Last Updated: January 2026*
