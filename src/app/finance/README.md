Finance module (minimal Angular standalone components)

Files added:
- `src/app/finance/types.ts` - TypeScript types for finance domain
- `src/app/finance/supabase-finance.service.ts` - Angular service wrapping Supabase client and finance operations
- `src/app/finance/finance-dashboard.component.ts/.html` - Secretary finance dashboard and ledger
- `src/app/finance/new-collection.component.ts/.html` - New collection flow with patient search, appointment and service select
- `src/app/finance/close-day.component.ts/.html` - Close day UI and guard
- `src/app/finance/doctor-finance-report.component.ts/.html` - Doctor report (totals and breakdown)
- `src/app/finance/date-range-selector.component.ts` - Simple date range selector used by doctor report
- `src/app/finance/finance.routes.ts` - Route definitions to add to your app router

Integration notes

1) Add environment variables (for dev):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   The service reads from `window` keys or `process.env` as a fallback. Adjust as needed for your environment.

2) Wire routes into your main router by importing `FINANCE_ROUTES` and adding to your `RouterModule` or root routes.

3) These standalone components use reactive forms and no extra libraries. They show minimal UI and inline alerts for errors.

4) To add styles include `src/app/finance/finance.css` in your global styles or import it into the host component.


4) Timezone: Cairo local day boundaries are computed using `Intl` and an explicit +02:00 offset in the ISO boundaries. Adjust if you need DST awareness.

5) RLS: code assumes RLS is present and uses `auth.getUser()` to set created_by/closed_by when available. Ensure your Supabase policies allow these inserts for appropriate roles.

6) Tests and styling are minimal. Enhance styles and access control as needed.
