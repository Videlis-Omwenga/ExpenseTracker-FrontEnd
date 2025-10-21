# API Client Migration Example

## Example: Updating Company Admin Dashboard

### Before (Using Direct Fetch):
```typescript
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${BASE_API_URL}/company-admin/get-data`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem(
          "expenseTrackerToken"
        )}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      setUsers(data.getUsers || []);
      setRoles(data.getRoles || []);
    } else {
      toast.error(data.message || "Failed to fetch data");
    }
  } catch (error) {
    toast.error(`Failed to fetch data: ${error}`);
  } finally {
    setLoading(false);
  }
};
```

### After (Using apiClient):
```typescript
import { apiClient } from "@/app/utils/apiClient";

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await apiClient(`${BASE_API_URL}/company-admin/get-data`, {
      method: "GET",
    });

    const data = await response.json();

    if (response.ok) {
      setUsers(data.getUsers || []);
      setRoles(data.getRoles || []);
    } else {
      toast.error(data.message || "Failed to fetch data");
    }
  } catch (error) {
    toast.error(`Failed to fetch data: ${error}`);
  } finally {
    setLoading(false);
  }
};
```

### Or (Using useApi Hook - Recommended):
```typescript
import { useApi } from "@/app/hooks/useApi";
import { useState } from "react";

export default function CompanyAdminDashboard() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.get('/company-admin/get-data');
      setUsers(data.getUsers || []);
      setRoles(data.getRoles || []);
    } catch (error) {
      toast.error(`Failed to fetch data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

## Key Changes Required:

1. ✅ **Remove Authorization header** - apiClient handles it automatically
2. ✅ **Import apiClient or useApi** at the top of file
3. ✅ **Replace fetch() with apiClient()** or **use hook methods**
4. ✅ **Remove manual token retrieval** from localStorage
5. ✅ **Keep error handling** - it still works the same

## Benefits:

- 🚀 **Automatic token refresh** on 401 errors
- 🔄 **Request retry** after token refresh
- 🛡️ **Centralized auth logic**
- ✨ **Cleaner code**
- 📊 **Better error handling**
