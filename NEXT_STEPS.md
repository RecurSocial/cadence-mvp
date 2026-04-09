# Cadence MVP - Next Steps Guide

**Current Status:** Weeks 1-4 Complete ✅  
**Next Phase:** Weeks 5-8 (Office Dashboard + Query Layer)

---

## Before We Build Weeks 5-8

### 1. Test What We Built (Today)
**You should:**
- [ ] Run `npm run dev` locally
- [ ] Navigate to `/dashboard`
- [ ] Set up Supabase (run `database.sql`)
- [ ] Create test org ID
- [ ] Add 3-5 test services
- [ ] Add 2-3 test practitioners
- [ ] Add 1-2 test vendors
- [ ] Test edit/delete on each
- [ ] Report any bugs/UI issues

**Expected Time:** 30-45 minutes

### 2. Import Euphoria Data
**You have:**
- `Euphoria_Service_Matrix.xlsx` (130 services, 12 staff, 20+ vendors)

**You need to:**
- [ ] Manually enter services into dashboard (or we build import script)
- [ ] Add all 12 staff members with roles
- [ ] Add all vendors with co-op budgets
- [ ] Test certifications matrix (who can do what)

**Expected Time:** 2-3 hours (or faster with import script)

### 3. Feedback on UI/UX
**Questions to answer:**
- Are the dashboard tabs intuitive?
- Is the form layout clear?
- Do you want different ordering/fields?
- Are the category lists correct?
- Missing any fields in forms?

**Then we iterate.**

---

## Weeks 5-8 Build Plan (Office Dashboard Query Layer)

### Week 5: Multi-Dimensional Query Building

**What gets built:**
```
┌─ Query Engine
│  ├─ Filter by Vendor
│  ├─ Filter by Service
│  ├─ Filter by Practitioner Role
│  ├─ Filter by Service Certification Status
│  └─ Filter by Approval Level
│
└─ API Endpoints
   ├─ /api/query/services?vendor=allergan
   ├─ /api/query/practitioners?role=nurse&certified_for=botox
   ├─ /api/query/services?category=neurotoxins
   └─ /api/query/dashboard/summary
```

**Frontend Component:**
- Search/filter bar
- Dynamic filter controls
- Real-time query updates

### Week 6: Dashboard Visualizations

**What gets built:**
- Practitioners matrix: Who can offer what?
- Services coverage: Which staff can do each service?
- Vendor summary: Total co-op budget by vendor
- Role breakdown: How many nurses, aestheticians, etc.?

**Charts:**
- Bar chart: Co-op budget by vendor
- Heatmap: Practitioner certifications by service
- Pie chart: Staff by role

### Week 7: Integration with Approval Workflow

**What gets built:**
API endpoints for approval system to query:
- "Is Kim certified to post about Botox?" → YES/NO
- "What approval rules apply to Allergan products?" → Returns rules
- "Is Michelle an owner?" → Returns auto-approval flag

**These endpoints are called by approval workflow later.**

### Week 8: Testing + Polish

- Test all queries with Euphoria data
- Verify performance
- Edge case handling
- Bug fixes
- Documentation

---

## Weeks 9-11 Build Plan (Approval Workflow)

### Week 9: Compliance-Aware Approval

**What gets built:**
```
Staff drafts post about "Botox"
    ↓
System queries: "Can [staff] post about Botox?"
    ├─ Is Botox a valid service? YES
    ├─ Is [staff] certified? YES/NO
    └─ Result: ALLOWED / BLOCKED
    ↓
If ALLOWED:
    → Send to approval queue for owner
If BLOCKED:
    → Show error: "You're not certified for this service"
```

**Database Tables Needed:**
- `approval_rules` (per service, per vendor)
- `approval_queue` (pending approvals)
- `approval_history` (audit trail)

### Week 10: Content Calendar + Auto-Fill Integration

**What gets built:**
- Weekly calendar interface
- Auto-fill logic: "Generate 5 posts for this week"
- Template suggestion based on certifications
- Approval workflow integration

**Logic:**
```
Staff opens calendar → Monday morning
    ↓
System sees: "Service X, Service Y, Service Z need posts"
    ↓
Checks: "Which staff is certified for each?"
    ↓
Generates 3 draft posts (1 per service)
    ↓
Staff approves all 3 in "10-Minute Monday"
    ↓
Posts schedule for rest of week
```

### Week 11: QA + Euphoria Testing

- Full end-to-end testing
- Euphoria user testing
- Bug fixes
- Performance optimization

---

## Immediate Action Items (Next 1 Week)

### For Kevin:
1. **Test the foundation build**
   - Run locally
   - Try adding/editing services
   - Report bugs

2. **Prepare Euphoria data for import**
   - Organize the 130 services
   - Confirm all 12 staff and roles
   - List all vendors with co-op budgets

3. **Review UI/UX**
   - Do the dashboards make sense?
   - Any changes before we add complexity?

4. **Consider: Import script vs. manual?**
   - Import script takes 3-4 hours but saves manual data entry
   - Manual entry takes 2-3 hours, good for testing
   - Recommendation: Start manual (test the UI), then script if needed

### For Claude (Next Session):
1. Iterate on foundation based on feedback
2. Build Office Dashboard query layer
3. Create Euphoria import script (if needed)

---

## Timeline Reality Check

**Current State (Today):**
- ✅ API routes working
- ✅ Dashboards functional
- ✅ Database schema ready

**By End of Week 1:**
- Euphoria data entered
- All bugs fixed
- UI/UX finalized

**By End of Weeks 5-8:**
- Office Dashboard queries live
- Multi-dimensional filtering working
- Integration points ready for approval workflow

**By End of Weeks 9-11:**
- Approval workflow complete
- Content calendar functional
- Ready for Euphoria beta

**By Week 12:**
- Internal launch with Euphoria
- Case study data collection begins

---

## Key Decisions Needed (Before Weeks 5-8)

1. **Import Script: Build it or skip it?**
   - Build: Adds 1-2 weeks but saves manual work
   - Skip: Manual entry is good for testing, quicker start

2. **Multi-location support: When?**
   - Phase 1: Single location per org (simpler)
   - Phase 2+: Multi-location dashboards

3. **Approval permissions: Confirm approach?**
   - Staff: Always requires approval
   - Managers: Faster approval (maybe 60-sec auto-approve)
   - Owners: Auto-approve (as discussed)

4. **Certification matrix: UI preference?**
   - Table view: Service rows, practitioner columns, checkboxes
   - Matrix view: Interactive heatmap
   - Both?

---

## Code Organization for Weeks 5-8

**New folders that will be created:**
```
src/
├── components/
│   ├── dashboards/ (existing)
│   ├── query/ (new - query builder UI)
│   ├── charts/ (new - visualizations)
│   └── office-dashboard/ (new - main dashboard)
├── lib/
│   ├── supabase/ (existing)
│   ├── queries/ (new - complex query logic)
│   └── utils/ (new - helpers)
└── app/
    ├── api/ (existing)
    ├── dashboard/ (existing)
    └── office/ (new - office dashboard page)
```

---

## Questions Before Next Session?

Before we start Weeks 5-8, confirm:
1. Does the foundation build work on your machine?
2. Any feedback on the UI/UX?
3. Import script: yes or no?
4. Approval permissions: confirm the 3-level approach?
5. Timeline acceptable (11 weeks total)?

---

## Success Criteria for This Session ✅

- [x] Database schema created
- [x] All CRUD APIs working
- [x] Dashboard components built
- [x] Services/Practitioners/Vendors fully managed
- [x] TypeScript types complete
- [x] Ready for real data import
- [x] Documentation complete

---

**Next Session:**
- Testing + feedback iteration
- Office Dashboard layer build begins
- Weeks 5-8 development starts

**You're on track.** 🚀
