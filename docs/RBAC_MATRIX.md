# RBAC Permission Matrix

This document defines the Role-Based Access Control (RBAC) mapping for the Cape Town GIS Platform.

## Role Hierarchy & Permissions

The system uses a hierarchical role structure where higher roles inherit permissions from lower ones.

| Permission | Viewer | Analyst | Power User | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Basic Map Viewing** | ✅ | ✅ | ✅ | ✅ |
| **Search & Filter** | ✅ | ✅ | ✅ | ✅ |
| **Draw & Measure** | ✅ | ✅ | ✅ | ✅ |
| **View Valuation Data** | ❌ | ✅ | ✅ | ✅ |
| **Spatial Analysis** | ❌ | ✅ | ✅ | ✅ |
| **Export Data** | ❌ | ❌ | ✅ | ✅ |
| **Manage Users** | ❌ | ❌ | ❌ | ✅ |
| **Invite New Users** | ❌ | ❌ | ❌ | ✅ |
| **View Audit Logs** | ❌ | ❌ | ❌ | ✅ |

### Key Role Definitions

*   **Viewer**: Baseline access. Can view maps, search for properties, and use **Draw** tools to annotate the map.
*   **Analyst**: Can access sensitive valuation data and perform basic spatial analysis.
*   **Power User**: Can export datasets and perform advanced spatial operations.
*   **Admin**: Full tenant-level control. Can manage users, send invites, and monitor the audit log.

---
*Note: The Viewer role explicitly includes "draw" permissions to allow basic map interaction and feedback.*
