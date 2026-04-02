# Approval Request System - Quick Reference

## 🎯 At a Glance

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Engineer** | Submit requests via `/api/requests` | Directly modify Projects/Tasks |
| **Manager** | Approve/Deny requests, Direct DB access | Can't create other users' requests |
| **Admin** | Everything | Nothing (full access) |

## 📡 API Quick Reference

### Engineer: Submit Request
```bash
POST /api/requests
Content-Type: application/json

{
  "type": "ADD_PROJECT",
  "payload": {
    "name": "Project Name",
    "description": "Description",
    "clientId": "client-123",
    "managerId": "manager-456"
  }
}
```

### Manager: Get Pending Requests
```bash
GET /api/requests
# Returns array of PENDING requests
```

### Manager: Approve Request
```bash
PATCH /api/requests/{id}/approve
# Executes payload on database
```

### Manager: Deny Request
```bash
PATCH /api/requests/{id}/deny
Content-Type: application/json

{
  "comment": "Reason for denial..."
}
```

## 🛣️ Navigation

| Role | Should Visit |
|------|--------------|
| Engineer | Projects, Tasks, Estimator |
| Manager | **Requests** ← Approval hub, Projects, Estimator |
| Admin | All tabs including Users |

## 📝 Supported Request Types

```
ADD_PROJECT    → Create new project
EDIT_PROJECT   → Modify existing project
ADD_TASK       → Create new task
EDIT_TASK      → Modify existing task
```

**Example Payloads:**

### ADD_PROJECT
```json
{
  "name": "Building Complex",
  "description": "3-story building",
  "location": "Downtown Area",
  "clientId": "c123",
  "managerId": "m456",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

### EDIT_PROJECT
```json
{
  "id": "proj-789",
  "name": "Updated Name",
  "status": "IN_PROGRESS",
  "endDate": "2025-06-30"
}
```

### ADD_TASK
```json
{
  "title": "Foundation Work",
  "description": "Complete foundation",
  "projectId": "proj-789",
  "assignedToId": "user-123",
  "dueDate": "2025-02-15"
}
```

### EDIT_TASK
```json
{
  "id": "task-456",
  "title": "Updated Task",
  "status": "IN_PROGRESS",
  "dueDate": "2025-02-20"
}
```

## 💻 For Developers

### Use in Forms (Engineer Side)
```typescript
import { submitRequest } from "@/lib/requests";

const handleSubmit = async (formData) => {
  await submitRequest("ADD_PROJECT", {
    name: formData.name,
    description: formData.description,
    clientId: formData.clientId,
    managerId: formData.managerId,
  });
  // No need to handle errors - toast shows them
};
```

### Request Components
- `RequestDetailsDialog` - Review dialog
- Requests dashboard page - `/dashboard/requests`

### Files to Know
- API logic: `/app/api/requests/`
- UI: `/components/requests/`, `/app/dashboard/requests/`
- Utils: `/lib/requests.ts`
- Schema: `/prisma/schema.prisma`

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| "Only engineers can submit requests" | Switch to ENGINEER role in dev dropdown |
| "Only managers can approve requests" | Switch to MANAGER role to approve |
| "Comment is required" | Denials require feedback |
| Request not in table | Check it's PENDING status, not APPROVED/DENIED |

## ✅ Status Codes

| Code | Meaning |
|------|---------|
| 201 | Request created successfully |
| 200 | Success (approval/denial) |
| 400 | Bad request (missing fields, invalid data) |
| 403 | Forbidden (wrong role) |
| 404 | Request not found |
| 500 | Server error |

## 🔄 Request States

```
PENDING   → Awaiting manager review (shown in dashboard)
APPROVED  → Manager approved, DB updated
DENIED    → Manager denied with comment
```

## 📊 Manager Dashboard Cards

- **Pending Requests**: Count of PENDING requests
- **Engineers**: Number of unique engineers with pending requests
- **Request Types**: Number of different request types pending

## 🎨 UI Components Used

- `Dialog` - Request details modal
- `Table` - Requests list
- `Badge` - Request type/status tags
- `Button` - Actions
- `Textarea` - Denial comments
- `Alert` - Error messages

## 🧪 Testing Checklist

- [ ] Engineer can submit request
- [ ] Request appears in manager dashboard
- [ ] Manager can view request details
- [ ] Manager can approve (DB updates)
- [ ] Manager can deny (requires comment)
- [ ] Approved requests disappear from pending
- [ ] Toast notifications show on all actions
- [ ] Errors handled gracefully

## 📚 Documentation Files

- `APPROVAL_REQUEST_SYSTEM.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `QUICK_REFERENCE.md` - This file

---

**Version**: 1.0  
**Build Status**: ✅ Production Ready
