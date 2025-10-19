# Visual Flow Diagrams - Hierarchy-Based Approval System

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                          │
│                                                                 │
│  1. Create Hierarchies                                          │
│     ┌──────────────────────────────────────┐                   │
│     │ • Department Head                    │                   │
│     │ • Regional Manager                   │                   │
│     │ • Finance Director                   │                   │
│     │ • CFO                                │                   │
│     └──────────────────────────────────────┘                   │
│                                                                 │
│  2. Assign Hierarchies to Users                                 │
│     ┌──────────────────────────────────────┐                   │
│     │ Alice   → ☑ Department Head          │                   │
│     │ Bob     → ☑ Regional Manager         │                   │
│     │ Charlie → ☑ Finance Director         │                   │
│     └──────────────────────────────────────┘                   │
│                                                                 │
│  3. Create Workflow with Hierarchy Steps                        │
│     ┌──────────────────────────────────────┐                   │
│     │ Step 1: Department Head (Required)   │                   │
│     │ Step 2: Regional Manager (Optional)  │                   │
│     │ Step 3: Finance Director (Required)  │                   │
│     └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXPENSE CREATION FLOW                        │
│                                                                 │
│  Employee Submits Expense                                       │
│     ┌──────────────────┐                                        │
│     │ Amount: $1,000   │                                        │
│     │ Desc: Travel     │                                        │
│     │ Category: Travel │                                        │
│     └──────────────────┘                                        │
│              ↓                                                  │
│  Backend Auto-Generates Approval Steps                          │
│     ┌──────────────────────────────────────┐                   │
│     │ expense_hierarchy_steps:             │                   │
│     │ ─────────────────────────────────    │                   │
│     │ Step 1: Dept Head    → PENDING       │                   │
│     │ Step 2: Regional Mgr → PENDING       │                   │
│     │ Step 3: Finance Dir  → PENDING       │                   │
│     └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      APPROVAL FLOW                              │
│                                                                 │
│  Step 1: Alice (Department Head)                                │
│     ┌──────────────────────────────────────┐                   │
│     │ Login → See Expense                  │                   │
│     │ Review → Approve ✓                   │                   │
│     │ Step 1: PENDING → APPROVED           │                   │
│     └──────────────────────────────────────┘                   │
│              ↓                                                  │
│  Step 2: Bob (Regional Manager) - OPTIONAL                      │
│     ┌──────────────────────────────────────┐                   │
│     │ Bob can approve OR skip              │                   │
│     │ (Step is optional)                   │                   │
│     └──────────────────────────────────────┘                   │
│              ↓                                                  │
│  Step 3: Charlie (Finance Director)                             │
│     ┌──────────────────────────────────────┐                   │
│     │ Charlie can see expense!             │                   │
│     │ (Step 2 is optional, so allowed)    │                   │
│     │ Review → Approve ✓                   │                   │
│     │ Step 3: PENDING → APPROVED           │                   │
│     └──────────────────────────────────────┘                   │
│              ↓                                                  │
│  All Required Steps Approved                                    │
│     ┌──────────────────────────────────────┐                   │
│     │ Expense Status: APPROVED ✅          │                   │
│     │ Ready for payment                    │                   │
│     └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Optional vs Required Logic

### Scenario A: All Steps Required

```
Workflow:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Step 1    │     │   Step 2    │     │   Step 3    │
│ Dept Head   │────▶│ Regional    │────▶│  Finance    │
│ (REQUIRED)  │     │ (REQUIRED)  │     │ (REQUIRED)  │
└─────────────┘     └─────────────┘     └─────────────┘

Flow:
Alice approves Step 1
        ↓
Bob MUST approve Step 2 ← Charlie CANNOT see yet
        ↓
Charlie approves Step 3
        ↓
Expense APPROVED ✅
```

### Scenario B: Step 2 Optional

```
Workflow:
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Step 1    │     │   Step 2    │     │   Step 3    │
│ Dept Head   │────▶│ Regional    │────▶│  Finance    │
│ (REQUIRED)  │     │ (OPTIONAL)  │     │ (REQUIRED)  │
└─────────────┘     └─────────────┘     └─────────────┘

Flow:
Alice approves Step 1
        ↓
        ├──▶ Charlie can see expense NOW! ◀── (Step 2 is optional)
        │
        └──▶ Bob can still approve if needed

Charlie approves Step 3
        ↓
Expense APPROVED ✅ (even if Step 2 still PENDING)
```

---

## 🗄️ Database Schema Relationships

```
┌─────────────────────┐
│    institutions     │
│                     │
│  id                 │───┐
└─────────────────────┘   │
                          │
┌─────────────────────┐   │
│    hierarchies      │   │
│                     │   │
│  id                 │   │
│  name               │   │
│  institutionId      │◀──┘
└──────────┬──────────┘
           │
           │ ┌─────────────────────┐
           │ │     users           │
           │ │                     │
           └─│  id                 │
             └──────────┬──────────┘
                        │
           ┌────────────┴────────────┐
           │                         │
┌──────────▼──────────┐   ┌─────────▼────────────┐
│  user_hierarchies   │   │  workflow_hierarchy  │
│  (Many-to-Many)     │   │  _steps              │
│                     │   │                      │
│  userId             │   │  workflowId          │
│  hierarchyId        │   │  hierarchyId         │
└─────────────────────┘   │  roleId              │
                          │  order               │
                          │  isOptional          │
                          └──────────┬───────────┘
                                     │
                                     │ (copied on expense creation)
                                     │
                          ┌──────────▼───────────┐
                          │ expense_hierarchy    │
                          │ _steps               │
                          │                      │
                          │  expenseId           │
                          │  hierarchyId         │
                          │  roleId              │
                          │  order               │
                          │  isOptional          │
                          │  status ◀────────────── PENDING/APPROVED/REJECTED
                          │  approvedById        │
                          └──────────────────────┘
```

---

## 🎯 Approval Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│         User tries to see/approve expense                   │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
            ┌───────────────────────┐
            │ Find first PENDING    │
            │ step in expense       │
            └───────────┬───────────┘
                        ↓
            ┌───────────────────────┐
            │ Does user have this   │
            │ hierarchy?            │
            └───────┬───────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
       YES                     NO
        │                       │
        ↓                       ↓
┌───────────────┐   ┌───────────────────────┐
│ User can      │   │ Is current step       │
│ approve!      │   │ OPTIONAL?             │
│ ✅            │   └───────┬───────────────┘
└───────────────┘           │
                ┌───────────┴───────────┐
                │                       │
               YES                     NO
                │                       │
                ↓                       ↓
    ┌───────────────────────┐   ┌──────────────┐
    │ Check next steps      │   │ User cannot  │
    │ for user's            │   │ see expense  │
    │ hierarchies           │   │ ❌           │
    └───────┬───────────────┘   └──────────────┘
            │
            ↓
    ┌───────────────────────┐
    │ Does user have any    │
    │ upcoming hierarchy?   │
    └───────┬───────────────┘
            │
    ┌───────┴──────────┐
    │                  │
   YES                NO
    │                  │
    ↓                  ↓
┌──────────────┐   ┌──────────────┐
│ User can see │   │ User cannot  │
│ expense but  │   │ see expense  │
│ cannot       │   │ ❌           │
│ approve      │   └──────────────┘
│ current step │
└──────────────┘
```

---

## 📱 User Interface Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                           │
│                                                              │
│  Tab: Approval Hierarchy                                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Hierarchy Name          Created      Actions       │     │
│  │  ─────────────────────────────────────────────     │     │
│  │  Department Head         Jan 1       [Edit][Del]   │     │
│  │  Regional Manager        Jan 2       [Edit][Del]   │     │
│  │  Finance Director        Jan 3       [Edit][Del]   │     │
│  │                                                     │     │
│  │  [+ Create Hierarchy]                              │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Tab: Users                                                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Create User Modal                                 │     │
│  │  ┌──────────────────────────────────────────┐     │     │
│  │  │ Name: Alice                              │     │     │
│  │  │ Email: alice@example.com                 │     │     │
│  │  │                                          │     │     │
│  │  │ Roles: ☑ Manager                         │     │     │
│  │  │                                          │     │     │
│  │  │ Hierarchies:                             │     │     │
│  │  │  ☑ Department Head                       │     │     │
│  │  │  ☐ Regional Manager                      │     │     │
│  │  │  ☐ Finance Director                      │     │     │
│  │  │                                          │     │     │
│  │  │  [Cancel]  [Create User]                 │     │     │
│  │  └──────────────────────────────────────────┘     │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    WORKFLOWS PAGE                            │
│                                                              │
│  Workflow: Standard Approval                                 │
│                                                              │
│  Hierarchy-Based Approval Levels (3)                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Order  Hierarchy          Role      Status        │     │
│  │  ────────────────────────────────────────────      │     │
│  │  1     Department Head    Manager   ✓ Required     │     │
│  │  2     Regional Manager   Regional  ⚠ Optional     │     │
│  │  3     Finance Director   Finance   ✓ Required     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Add Hierarchy Level:                                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Hierarchy: [Select...▼] Role: [Select...▼] [Add]  │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  [Save Changes]                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                 EXPENSE APPROVALS PAGE                       │
│                                                              │
│  Pending Approvals for You                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Expense #1234                                     │     │
│  │  Amount: $1,000  |  Travel Expense                 │     │
│  │                                                     │     │
│  │  Approval Progress:                                │     │
│  │  ┌────────────────────────────────────────────┐   │     │
│  │  │ ✅ Step 1: Department Head                 │   │     │
│  │  │    Approved by Alice on Jan 5              │   │     │
│  │  │                                            │   │     │
│  │  │ ⏳ Step 2: Regional Manager (Optional)     │   │     │
│  │  │    Pending                                 │   │     │
│  │  │                                            │   │     │
│  │  │ → Step 3: Finance Director (YOU)          │   │     │
│  │  │    Waiting for your approval               │   │     │
│  │  └────────────────────────────────────────────┘   │     │
│  │                                                     │     │
│  │  Comments: [                                ]     │     │
│  │  [Reject]  [Approve]                              │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎬 Animation: Approval Flow

```
Time: T0 (Expense Created)
─────────────────────────────────────────────────
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Step 1  │     │ Step 2  │     │ Step 3  │
│ PENDING │     │ PENDING │     │ PENDING │
│         │     │         │     │         │
└─────────┘     └─────────┘     └─────────┘
   Alice          Bob           Charlie
  (can see)    (cannot see)  (cannot see)


Time: T1 (Alice Approves)
─────────────────────────────────────────────────
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Step 1  │     │ Step 2  │     │ Step 3  │
│APPROVED │     │ PENDING │     │ PENDING │
│   ✅    │     │         │     │         │
└─────────┘     └─────────┘     └─────────┘
   Alice           Bob          Charlie
 (approved)   (cannot see)   (CAN SEE NOW!)
                             ◀── Step 2 optional


Time: T2 (Charlie Approves)
─────────────────────────────────────────────────
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Step 1  │     │ Step 2  │     │ Step 3  │
│APPROVED │     │ PENDING │     │APPROVED │
│   ✅    │     │    ⏳    │     │   ✅    │
└─────────┘     └─────────┘     └─────────┘

        EXPENSE STATUS: APPROVED ✅
    (All REQUIRED steps completed)
```

---

## 📈 Success Metrics

After implementation, you should see:

✅ **100% automated approval routing**
✅ **Zero manual step assignment**
✅ **Flexible optional/required steps**
✅ **Clear approval progress tracking**
✅ **Reduced approval bottlenecks**

---

This visual guide helps understand how the system works at every level!
