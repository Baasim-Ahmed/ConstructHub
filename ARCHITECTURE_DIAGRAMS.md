# Approval Request System - Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ConstructHub CRM                              │
│              Approval Request System Flow                         │
└─────────────────────────────────────────────────────────────────┘

ENGINEER                          DATABASE                      MANAGER
  │                                  │                            │
  ├─ Can't directly modify ──────────┤                            │
  │   (No access to Projects/Tasks   │                            │
  │    create/update API)            │                            │
  │                                  │                            │
  ├─ Submits Request ───────────────→ Request Table              │
  │   (POST /api/requests)           │                            │
  │                                  │                            ├─ Reviews Requests
  │   {type, payload}                │                            │  (GET /api/requests)
  │                                  │                            │
  │   Toast: "Request Submitted"     │                            │
  │                                  │ Sees Pending Request       │
  │                                  ├──────────────────────────→│
  │                                  │                            │
  │                                  │                      Can Approve/Deny
  │                                  │                            │
  │                                  │  If Approve               │
  │                                  │←──────────────────────────┤
  │                                  │                            │
  │                                  ├─ Payload Executed         │
  │                                  │  (Project/Task created)    │
  │                                  │                            │
  │                                  ├─ Request → APPROVED        │
  │                                  │                            │
  │                                  │  If Deny                   │
  │                                  │←──────────────────────────┤
  │                                  │  (+ Comment)               │
  │                                  │                            │
  │                                  ├─ Request → DENIED          │
  │                                  │  Comment stored            │
```

## Database Schema Relationships

```
┌──────────────┐
│    User      │
├──────────────┤
│ id (PK)      │
│ name         │
│ email        │
│ role         │◄─────────────────┐
│ ...          │                   │
└──────────────┘                   │
       △                           │
       │                           │
   1:N │                    1:N    │
       │                           │
       ├─ requestsCreated ◄────┐   │
       │                        │   │
       └─ requestsReviewed ◄───┤───┘
                                │
                                │
                    ┌───────────┴──────────┐
                    │    Request           │
                    ├──────────────────────┤
                    │ id (PK)              │
                    │ type (String)        │
                    │ payload (Json)       │
                    │ status (PENDING)     │
                    │ createdById (FK)     │
                    │ reviewedById (FK)    │
                    │ comment              │
                    │ createdAt            │
                    │ updatedAt            │
                    └──────────────────────┘
```

## Request Lifecycle State Machine

```
                    ┌─────────────────┐
                    │  REQUEST CREATED │
                    └────────┬─────────┘
                             │
                    ┌────────▼────────┐
                    │  PENDING        │◄─ Engineer submits form
                    │  (Awaiting)     │
                    └────────┬────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
          ┌────────▼────────┐  ┌──────▼────────┐
          │  APPROVED       │  │  DENIED       │
          │  (Committed)    │  │  (Rejected)   │
          │                 │  │               │
          │ - DB updated    │  │ - Comment     │
          │ - Entity created│  │   stored      │
          │ - No rollback   │  │ - No DB change│
          └─────────────────┘  └───────────────┘
                   │                   │
                   └───────────────────┘
                   (Both are terminal states)
```

## API Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                             │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │ POST /api/requests│
                    └────────┬─────────┘
                             │
                 ┌───────────┴──────────────┐
                 │                          │
                 ▼ (Engineer Role Check)    ▼
            ┌─────────────┐         ┌────────────┐
            │ Valid       │         │ Forbidden  │
            │ (ENGINEER)  │         │ Error 403  │
            └─────┬───────┘         └────────────┘
                  │
                  ▼ (Validate Payload)
            ┌─────────────┐
            │ Valid       │
            │ Payload     │
            └─────┬───────┘
                  │
                  ▼ (Create Request)
            ┌─────────────────────┐
            │ Request Table Entry │
            │ Status: PENDING     │
            └─────┬───────────────┘
                  │
                  ▼
            ┌─────────────────┐
            │ Return 201      │
            │ + Request Data  │
            └─────────────────┘


    ┌──────────────────────────────────────────────────────┐
    │  GET /api/requests                                    │
    │  (Managers only)                                      │
    └──────────────────────────────────────────────────────┘
            │
            ▼ (Role Check)
        ┌────────────────────┐
        │ Return all PENDING │
        │ requests with:     │
        │ - Creator info     │
        │ - Payload data     │
        │ - Timestamps       │
        └────────────────────┘


    ┌──────────────────────────────────────────────────────┐
    │  PATCH /api/requests/{id}/approve                     │
    │  (Managers only)                                      │
    └──────────────────────────────────────────────────────┘
            │
            ├─ Role Check (MANAGER/ADMIN)
            ├─ Status Check (must be PENDING)
            ├─ Get Request & Payload
            │
            └─ Execute Based on Type:
               ├─ ADD_PROJECT → prisma.project.create(payload)
               ├─ EDIT_PROJECT → prisma.project.update(payload)
               ├─ ADD_TASK → prisma.task.create(payload)
               └─ EDIT_TASK → prisma.task.update(payload)
            │
            ├─ Update Request:
            │  ├─ status = APPROVED
            │  └─ reviewedById = manager.id
            │
            └─ Return 200 + Success Message


    ┌──────────────────────────────────────────────────────┐
    │  PATCH /api/requests/{id}/deny                        │
    │  (Managers only)                                      │
    └──────────────────────────────────────────────────────┘
            │
            ├─ Role Check (MANAGER/ADMIN)
            ├─ Status Check (must be PENDING)
            ├─ Validate Comment (required + non-empty)
            │
            ├─ Update Request:
            │  ├─ status = DENIED
            │  ├─ reviewedById = manager.id
            │  └─ comment = manager's feedback
            │
            └─ Return 200 + Success Message
```

## Frontend Component Tree

```
┌─────────────────────────────────────────────────────┐
│         Dashboard Layout                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  Sidebar (Navigation)                        │   │
│  │  - Projects                                  │   │
│  │  - Tasks                                     │   │
│  │  - [Requests] ◄─ MANAGER/ADMIN ONLY        │   │
│  │  - Estimator                                 │   │
│  │  - Users                                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  Requests Page (/dashboard/requests)        │   │
│  │                                              │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │ Stats Cards                          │  │   │
│  │  │ - Pending Count                      │  │   │
│  │  │ - Unique Engineers                   │  │   │
│  │  │ - Request Types                      │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  │                                              │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │ Requests Table                       │  │   │
│  │  ├──────────────────────────────────────┤  │   │
│  │  │ Type │ Engineer │ Date │ [View Btn] │  │   │
│  │  ├──────────────────────────────────────┤  │   │
│  │  │ ...  │ ...      │ ...  │    ...     │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  │         │                                    │   │
│  │         └─→ Click [View] ──────┐           │   │
│  │                                 │           │   │
│  │  ┌──────────────────────────────▼────────┐ │   │
│  │  │ RequestDetailsDialog Modal            │ │   │
│  │  ├─────────────────────────────────────┐ │ │   │
│  │  │ Title: Request Type                 │ │ │   │
│  │  │ Subtitle: Created By + Date         │ │ │   │
│  │  ├─────────────────────────────────────┤ │ │   │
│  │  │ Payload Details (key-value pairs)   │ │ │   │
│  │  ├─────────────────────────────────────┤ │ │   │
│  │  │ [Cancel] [Deny] [Approve]           │ │ │   │
│  │  └─────────────────────────────────────┘ │ │   │
│  │                                            │ │   │
│  │  ┌─ On Deny Click: Show Textarea ──────┐ │ │   │
│  │  │ Reason for Denial (mandatory)        │ │ │   │
│  │  │ [────────────────────────────────]   │ │ │   │
│  │  │ [Cancel] [Submit Denial]             │ │ │   │
│  │  └──────────────────────────────────────┘ │ │   │
│  │                                            │ │   │
│  └────────────────────────────────────────────┘ │   │
│                                                  │   │
└──────────────────────────────────────────────────┘
```

## Role-Based Access Control

```
                    ┌──────────────────────┐
                    │ User Requests       │
                    │ POST /api/requests  │
                    └──────┬───────────────┘
                           │
                    Check x-dev-role Header
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      ENGINEER          MANAGER            ADMIN
          │                │                │
          ▼                ▼                ▼
      ✅ ALLOW         ✅ ALLOW         ✅ ALLOW
      Submit          Approve/Deny      Everything
                      GET Requests

    ┌──────────────────────────────────────────┐
    │ GET /api/requests                        │
    │ PATCH /api/requests/[id]/approve         │
    │ PATCH /api/requests/[id]/deny            │
    └──────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
      ENGINEER          MANAGER            ADMIN
          │                │                │
          ▼                ▼                ▼
      ❌ DENY          ✅ ALLOW         ✅ ALLOW
      Forbidden        (Managers)       (Admins)
      (Error 403)
```

## Data Flow: Approval Process

```
1. SUBMISSION PHASE
   ┌─────────────┐
   │ Engineer    │
   │ Fills Form  │
   └────┬────────┘
        │
        ▼ (submitRequest())
   ┌─────────────────────────────┐
   │ POST /api/requests          │
   │ {type, payload}             │
   └────┬────────────────────────┘
        │
        ▼
   ┌──────────────────────────┐
   │ Request Created          │
   │ Status: PENDING          │
   │ In Database              │
   └────┬─────────────────────┘
        │
        ▼
   ┌─────────────────────────────┐
   │ Engineer sees toast:        │
   │ "Request submitted!"        │
   └─────────────────────────────┘


2. REVIEW PHASE
   ┌─────────────┐
   │ Manager     │
   │ Logs In     │
   └────┬────────┘
        │
        ▼ (GET /api/requests)
   ┌──────────────────────────┐
   │ Fetches PENDING          │
   │ Requests from DB         │
   └────┬─────────────────────┘
        │
        ▼
   ┌──────────────────────────┐
   │ Requests Table Updated   │
   │ Shows all pending        │
   └────┬─────────────────────┘
        │
        ▼
   ┌─────────────────────────────┐
   │ Manager Clicks "View"       │
   │ on a request                │
   └────┬────────────────────────┘
        │
        ▼
   ┌─────────────────────────────┐
   │ RequestDetailsDialog        │
   │ Shows full payload          │
   └─────────────────────────────┘


3. DECISION PHASE

   PATH A: APPROVAL
   ┌─────────────────────────────┐
   │ Manager Clicks "Approve"    │
   └────┬────────────────────────┘
        │
        ▼ (PATCH /api/requests/[id]/approve)
   ┌──────────────────────────────┐
   │ Server:                      │
   │ 1. Get Request + Payload     │
   │ 2. Validate Type             │
   │ 3. Execute DB Operation      │
   │    (create/update entity)    │
   │ 4. Set status = APPROVED     │
   │ 5. Set reviewedById          │
   └────┬─────────────────────────┘
        │
        ▼
   ┌─────────────────────────────┐
   │ Return 200 + Success        │
   └────┬────────────────────────┘
        │
        ▼
   ┌─────────────────────────────┐
   │ Manager sees toast:         │
   │ "Request approved!"         │
   └─────────────────────────────┘


   PATH B: DENIAL
   ┌─────────────────────────────┐
   │ Manager Clicks "Deny"       │
   └────┬────────────────────────┘
        │
        ▼
   ┌─────────────────────────────┐
   │ Textarea appears:           │
   │ "Reason for Denial"         │
   │ [───────────────────────]   │
   └────┬────────────────────────┘
        │
        ▼
   ┌─────────────────────────────┐
   │ Manager enters feedback     │
   │ Clicks "Submit"             │
   └────┬────────────────────────┘
        │
        ▼ (PATCH /api/requests/[id]/deny)
   ┌──────────────────────────────┐
   │ Server:                      │
   │ 1. Validate comment exists   │
   │ 2. Set status = DENIED       │
   │ 3. Set reviewedById          │
   │ 4. Save comment              │
   │ 5. NO DB modifications       │
   └────┬─────────────────────────┘
        │
        ▼
   ┌─────────────────────────────┐
   │ Return 200 + Success        │
   └────┬────────────────────────┘
        │
        ▼
   ┌─────────────────────────────┐
   │ Manager sees toast:         │
   │ "Request denied!"           │
   └─────────────────────────────┘
```

---

**Diagrams Version**: 1.0  
**Last Updated**: December 8, 2025
