# ConstructHub CRM - Approval Request System

## Overview

The Approval Request System is a role-based workflow that prevents direct database modifications by Engineers. Instead, Engineers submit requests that Managers must approve before changes are committed to the database.

## Architecture

### Role Hierarchy

- **ADMIN**: Full access to all features
- **MANAGER**: Can approve/deny requests and directly modify database
- **ENGINEER**: Can ONLY submit requests (no direct DB access)
- **CLIENT**: Read-only access

### Database Schema

A new `Request` model has been added to Prisma:

```prisma
model Request {
  id          String   @id @default(uuid())
  type        String   // "ADD_PROJECT", "EDIT_PROJECT", "ADD_TASK", "EDIT_TASK"
  payload     Json     // Store form data temporarily
  status      String   @default("PENDING") // PENDING | APPROVED | DENIED
  createdById String
  createdBy   User     @relation("RequestCreatedBy", fields: [createdById], references: [id])
  reviewedById String?  // Manager who reviewed
  reviewedBy  User?    @relation("RequestReviewedBy", fields: [reviewedById], references: [id])
  comment     String?  // Required when DENIED
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API Endpoints

### 1. Create Request (Engineers)
**POST** `/api/requests`

Engineers use this to submit requests instead of directly modifying the database.

**Request Body:**
```json
{
  "type": "ADD_PROJECT",
  "payload": {
    "name": "New Building Complex",
    "description": "3-story commercial building",
    "clientId": "client-123",
    "managerId": "manager-456",
    "startDate": "2025-01-01",
    "endDate": "2025-06-30"
  }
}
```

**Response:**
```json
{
  "id": "req-789",
  "type": "ADD_PROJECT",
  "payload": { ... },
  "status": "PENDING",
  "createdBy": {
    "id": "eng-123",
    "name": "John Engineer",
    "email": "john@constructhub.com",
    "role": "ENGINEER"
  }
}
```

### 2. Get All Pending Requests (Managers)
**GET** `/api/requests`

Retrieves all pending requests for manager review.

**Response:**
```json
[
  {
    "id": "req-789",
    "type": "ADD_PROJECT",
    "payload": { ... },
    "status": "PENDING",
    "createdBy": { ... },
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

### 3. Approve Request (Managers)
**PATCH** `/api/requests/{id}/approve`

Managers approve a request, which commits the payload to the database.

**Response:**
```json
{
  "message": "Request approved successfully",
  "request": { ... },
  "result": { /* Actual created/updated entity */ }
}
```

**Supported Types:**
- `ADD_PROJECT`: Creates a new project
- `EDIT_PROJECT`: Updates existing project
- `ADD_TASK`: Creates a new task
- `EDIT_TASK`: Updates existing task

### 4. Deny Request (Managers)
**PATCH** `/api/requests/{id}/deny`

Managers deny a request with mandatory feedback.

**Request Body:**
```json
{
  "comment": "Please provide more details about the project timeline and budget constraints."
}
```

**Response:**
```json
{
  "message": "Request denied successfully",
  "request": {
    "id": "req-789",
    "status": "DENIED",
    "comment": "Please provide more details...",
    "reviewedBy": {
      "id": "mgr-456",
      "name": "Jane Manager",
      "email": "jane@constructhub.com"
    }
  }
}
```

## Frontend Components

### 1. Requests Dashboard Page
**Location:** `/app/dashboard/requests/page.tsx`

Manager-only view showing:
- Statistics cards (pending count, unique engineers, request types)
- Table of all pending requests
- Quick actions to view details

**Features:**
- Auto-refresh button
- Real-time error handling
- Responsive table design

### 2. RequestDetailsDialog Component
**Location:** `/components/requests/RequestDetailsDialog.tsx`

Modal dialog for reviewing request details:
- Displays full request payload
- Shows engineer who submitted
- Option to approve or deny
- Mandatory comment field for denial

**Props:**
```typescript
interface RequestDetailsDialogProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: (requestId: string) => Promise<void>;
  onDeny?: (requestId: string, comment: string) => Promise<void>;
}
```

## Utility Functions

### submitRequest()
**Location:** `/lib/requests.ts`

Helper function for engineers to submit requests.

```typescript
import { submitRequest } from "@/lib/requests";

// Example usage in a form submission
const handleSubmit = async (formData) => {
  try {
    const request = await submitRequest("ADD_PROJECT", {
      name: formData.name,
      description: formData.description,
      clientId: formData.clientId,
      managerId: formData.managerId,
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
    // Show success toast and redirect
  } catch (error) {
    // Error is already handled with toast
  }
};
```

## Workflow

### Engineer Workflow

1. Engineer opens form (Create Project, Edit Task, etc.)
2. Fills in required fields
3. Clicks "Submit for Approval" button
4. Form data is sent to `/api/requests` as a new Request
5. Toast shows: "Request submitted to manager"
6. Engineer can track status in request history

### Manager Workflow

1. Manager navigates to "Requests" tab
2. Sees table of all pending requests
3. Clicks "View" button on a request
4. Dialog opens showing full details
5. Manager can:
   - **Approve**: Changes are committed to database
   - **Deny**: Requires entering feedback comment
6. Request status changes to APPROVED/DENIED
7. Toast confirms action

### Post-Approval

Once a request is approved:
- The payload is processed based on request type
- Database is updated with the new/modified entity
- Request status changes to APPROVED
- Engineer can see their request was approved

### Post-Denial

Once a request is denied:
- Request status changes to DENIED
- Manager's feedback comment is stored
- Request is removed from "Pending" list
- Engineer can view denied requests with feedback

## Implementation Guide

### For Project Creation Form
```typescript
import { submitRequest } from "@/lib/requests";

const handleCreateProject = async (formData) => {
  // Validate form
  if (!formData.name) return;

  // Submit as request instead of direct API call
  await submitRequest("ADD_PROJECT", {
    name: formData.name,
    description: formData.description,
    location: formData.location,
    clientId: formData.clientId,
    managerId: formData.managerId,
    startDate: formData.startDate,
    endDate: formData.endDate,
  });

  // Reset form
  // Optionally show request history
};
```

### For Project Edit Form
```typescript
const handleEditProject = async (projectId, formData) => {
  await submitRequest("EDIT_PROJECT", {
    id: projectId,
    name: formData.name,
    description: formData.description,
    location: formData.location,
    clientId: formData.clientId,
    managerId: formData.managerId,
    startDate: formData.startDate,
    endDate: formData.endDate,
    status: formData.status,
  });
};
```

## Security Considerations

1. **Role-Based Access**: API routes check `x-dev-role` header
2. **Request Validation**: All requests are validated before approval
3. **Audit Trail**: All requests logged with creator, reviewer, and timestamps
4. **Mandatory Comments**: Denials require explanatory feedback
5. **No Direct DB Access**: Engineers cannot bypass the request system

## Status Transitions

```
PENDING → APPROVED (Manager approves)
PENDING → DENIED (Manager denies with comment)
APPROVED/DENIED → (Final state, cannot be changed)
```

## Future Enhancements

1. **Request Notifications**: Real-time alerts when requests are approved/denied
2. **Request History**: Engineers can view all their submitted requests
3. **Bulk Approval**: Managers can approve multiple requests at once
4. **Request Templates**: Pre-filled forms for common operations
5. **Approval Chains**: Multi-level approval (e.g., Manager → Admin)
6. **Analytics**: Reports on approval rates and cycle times

## Troubleshooting

### Request not appearing in manager view
- Verify manager is on "Requests" tab
- Check request status is "PENDING"
- Confirm role is "MANAGER" or "ADMIN"

### Approval fails with database error
- Check payload contains required fields
- Verify IDs (clientId, managerId) exist in database
- Check date formats are valid ISO strings

### Denial requires comment
- Comment field is mandatory when denying
- Comment must not be empty or whitespace only
- Provide constructive feedback for engineer

---

**Version**: 1.0  
**Last Updated**: December 8, 2025
