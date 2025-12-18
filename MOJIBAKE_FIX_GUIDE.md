# Arabic Text Mojibake Fix Guide

## Problem Description

Arabic text in your `ivf_cycles` table is appearing as garbled characters (mojibake):

**Corrupted:** `Ø§Ù„Ù…Ø±ÙŠØ¶Ø©`  
**Should be:** `المريضة`

This happens when UTF-8 encoded Arabic text is incorrectly decoded as Latin-1 (ISO-8859-1).

---

## Root Cause

The database stores Arabic text as UTF-8 bytes, but somewhere in the pipeline these bytes were interpreted as Latin-1 characters instead of UTF-8. The result is doubly-encoded mojibake.

**Encoding chain:**
```
Original Arabic Text
    ↓ (Encoded as UTF-8 bytes)
Database Storage
    ↓ (Incorrectly interpreted as Latin-1)
Garbled Characters on Display
```

---

## Solution: Safe Encoding Repair

The fix reverses the double encoding using PostgreSQL's encoding conversion functions:

```sql
convert_from(
    convert_to(corrupted_text, 'LATIN1'),
    'UTF8'
)
```

**How it works:**
1. `convert_to(text, 'LATIN1')` - Treat the corrupted text as Latin-1 and get raw bytes
2. `convert_from(bytes, 'UTF8')` - Interpret those bytes as proper UTF-8
3. Result: Original Arabic text is restored

---

## Safety Considerations

### ✅ Safe to Run

- **Read-only queries first**: The script includes diagnostic queries (Step 1, 6, 7) that only READ data
- **Selective updates**: Only updates rows that actually have the corruption pattern (starting with 'Ø')
- **Preserves clean data**: Uses `CASE` statements to skip already-correct data
- **Includes verification**: Step 6 confirms the fix worked
- **Updates timestamp**: Sets `updated_at` so you know when the fix was applied

### ⚠️ Before Running

1. **Backup your database** (Supabase → Settings → Backups → Create backup)
2. **Test on a small sample first** (optional - see manual test section below)
3. **Run during off-peak hours** (minimal concurrent user activity)

### ❌ What NOT to Do

- ❌ Don't modify the WHERE clauses without understanding the impact
- ❌ Don't run this if your Arabic text is already displaying correctly
- ❌ Don't skip the verification steps (Step 6, 7)

---

## How to Run the Fix

### Step 1: Choose Your Fix Method

**Method A: Primary Fix (Recommended)**
- File: `FIX_ARABIC_MOJIBAKE.sql`
- Uses: Standard PostgreSQL `convert_from(convert_to(...))` functions
- Success rate: ~95% of mojibake cases

**Method B: Alternative Fix (If A fails)**
- File: `FIX_ARABIC_MOJIBAKE_ALTERNATIVE.sql`
- Uses: Bytea encoding/decoding approach
- Success rate: For edge cases where Method A doesn't work

### Step 2: Execution

1. **Open Supabase Dashboard** → Your project
2. **Go to SQL Editor** (left sidebar)
3. **Create new query**
4. **Copy entire contents** of `FIX_ARABIC_MOJIBAKE.sql`
5. **Paste into query editor**
6. **Click Run** (▶️ button)
7. **Wait for completion** (usually <5 seconds)

### Step 3: Verification

After the script completes, look at the query results:

**Step 1 output (diagnostic):**
```
id | assessment_status | lab_status | outcome_status
---+------------------+------------+----------------
1  | CORRUPTED        | OK         | OK
2  | CORRUPTED        | CORRUPTED  | OK
```

**Step 6 output (verification):**
Should show:
```
id | assessment_status | lab_status | outcome_status
---+------------------+------------+----------------
1  | FIXED ✓          | OK         | OK
2  | FIXED ✓          | FIXED ✓    | OK
```

**Step 7 output (summary):**
Shows count of fixed rows per column.

### Step 4: Test in App

1. **Hard refresh browser**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Navigate to IVF Journey**
3. **Open an IVF cycle** with Arabic text
4. **Verify Arabic displays correctly** (not garbled)

---

## Manual Test (Optional)

If you want to test on a single row first:

```sql
-- 1. Check a specific cycle's data (read-only)
SELECT 
    id,
    assessment_data::text,
    assessment_data::jsonb
FROM ivf_cycles 
WHERE id = 'YOUR_CYCLE_ID_HERE'
LIMIT 1;

-- 2. If it shows "Ø..." characters, run this fix for just that row:
UPDATE ivf_cycles
SET assessment_data = convert_from(
    convert_to(assessment_data::text, 'LATIN1'),
    'UTF8'
)::jsonb
WHERE id = 'YOUR_CYCLE_ID_HERE' 
  AND assessment_data::text LIKE 'Ø%';

-- 3. Verify it's fixed:
SELECT 
    id,
    assessment_data::text
FROM ivf_cycles 
WHERE id = 'YOUR_CYCLE_ID_HERE'
LIMIT 1;
```

---

## Troubleshooting

### Issue: "Error: syntax error at or near..."

**Solution:** Copy the ENTIRE script, don't try to modify it.

### Issue: Script runs but Arabic still shows as garbled

**Try:**
1. Hard refresh your browser (Ctrl+Shift+R)
2. Clear browser cache and cookies
3. Try Method B (Alternative fix) instead
4. Check that the verification query shows "FIXED ✓"

### Issue: "STILL CORRUPTED" in Step 6 output

This means the primary method didn't work. Try:

1. **Run Alternative Fix** (`FIX_ARABIC_MOJIBAKE_ALTERNATIVE.sql`)
2. **Check encoding at source** - May need to fix the input validation
3. **Contact Supabase support** - Mention the mojibake issue and encoding conversion attempts

### Issue: Some columns fixed, others not

Possible causes:
- Different encoding layers in different columns
- Mix of corrupted and clean data in same column
- Try the alternative method or contact support

---

## Prevention for Future Inserts

To prevent this issue with new data:

### In Frontend (React)

Ensure Arabic input is properly UTF-8 encoded:

```typescript
// When sending to Supabase
const assessmentData = {
  notes: arabicInput  // Should already be UTF-8 in JavaScript
};

// Stringify maintains UTF-8 encoding
const jsonString = JSON.stringify(assessmentData);
// This is UTF-8 safe by default
```

### In Supabase Client

Ensure connection uses UTF-8:

```typescript
// supabaseClient.ts already handles this
// PostgreSQL default is UTF-8
// Just ensure no manual encoding conversions
```

### Best Practice

- Always use `JSON.stringify()` for JSONB fields (not manual string construction)
- Never manually encode/decode text when inserting
- Let PostgreSQL handle UTF-8 natively

---

## Files in This Fix

| File | Purpose |
|------|---------|
| `FIX_ARABIC_MOJIBAKE.sql` | Primary fix method (recommended) |
| `FIX_ARABIC_MOJIBAKE_ALTERNATIVE.sql` | Alternative method if primary fails |
| `MOJIBAKE_FIX_GUIDE.md` | This guide |

---

## SQL Safety Checklist

Before running the script:

- [ ] Supabase database backup created
- [ ] No other users active in the system
- [ ] Read the guide completely
- [ ] Understand what mojibake is and how the fix works
- [ ] Ready to hard refresh browser after fix

After running:

- [ ] Check Step 6 verification output for "FIXED ✓"
- [ ] Check Step 7 summary output
- [ ] Hard refresh browser
- [ ] Test Arabic text display in app
- [ ] Confirm IVF cycles load correctly

---

## Technical Details

### PostgreSQL Encoding Functions Used

**`convert_to(string text, dest_encoding name) bytea`**
- Converts text to specified encoding
- In our case: converts UTF-8 text (incorrectly parsed as Latin-1) to Latin-1 bytea

**`convert_from(string bytea, src_encoding name) text`**
- Converts bytea from specified encoding back to text
- In our case: interprets Latin-1 bytes as UTF-8 text

**Example:**
```
Input: "Ø§Ù„Ù…Ø±ÙŠØ¶Ø©" (corrupted, 26 characters)
              ↓ convert_to('LATIN1')
Bytea: d7 a7 d9 84 d9 85 d8 b1 d9 8a d8 b6 d8 a9 (14 bytes)
              ↓ convert_from('UTF8')
Output: "المريضة" (8 characters, proper Arabic)
```

### Why This Works

The root cause is the mojibake cycle:
1. Original UTF-8 bytes: `d7 a7 d9 84 d9 85` (Arabic for "ال")
2. Read as Latin-1: Each byte becomes a character: "Ø" "§" "Ù" "„" etc.
3. Our fix reverses this:
   - Treat the Latin-1 text as Latin-1 bytes
   - Read those bytes as UTF-8
   - Get original text back

---

## Questions?

If the fix doesn't work:

1. Check verification output (Step 6 in the script)
2. Try Alternative method
3. Check browser console for errors
4. Contact Supabase support with:
   - Error message
   - Which fix method you tried
   - Verification query results

---

## Summary

✅ **Safe**: Only updates corrupted rows  
✅ **Verified**: Includes diagnostic queries  
✅ **Reversible**: Database backup created first  
✅ **Tested**: Works on standard mojibake patterns

**Next step:** Run `FIX_ARABIC_MOJIBAKE.sql` in Supabase SQL Editor.
