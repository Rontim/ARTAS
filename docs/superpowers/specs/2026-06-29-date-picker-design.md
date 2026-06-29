# Forest Academy Date Picker — Design

## Context

ARTAS currently uses 7 native `<input type="date">` fields (via the `Input` UI primitive) across `SemesterFormModal`, `StudentFormModal`, and `AcademicYearFormModal`. Native date inputs render with the browser's own chrome, which breaks the Forest Academy design system's visual consistency (no theming control over the calendar popup). This spec replaces all 7 with a single reusable `DatePicker` component built on `react-datepicker`, restyled to match the existing Soft Modern primitives (`Input`, `Modal`, etc.).

## Goals

- One reusable `DatePicker` primitive in `frontend/src/components/ui/`
- Fully themed calendar popup (forest-green selected day, on-brand header) — not a generic library look
- Replace all 7 existing native date inputs
- No changes to downstream form-submission code (value format stays `yyyy-MM-dd`)

## Non-goals

- Month-only or year-only picker modes (`showMonthYearPicker` / `showYearPicker`) — no current field needs unit-level granularity below a full date. Can be added later behind an optional `mode` prop if a concrete need arises.
- Date range *selection* (picking a start+end pair in one calendar) — the 3 modals already model start/end as two separate fields; we only add a cross-field min-date guard, not a unified range picker UI.

## Component API

New file: `frontend/src/components/ui/date-picker.tsx`

```ts
interface DatePickerProps {
  label?: string
  value: string | null | undefined   // 'yyyy-MM-dd', same format the native input produced
  onChange: (value: string) => void
  error?: string
  description?: string
  placeholder?: string               // default: "Select date"
  minDate?: string                   // 'yyyy-MM-dd' — disables days before this
  maxDate?: string                   // 'yyyy-MM-dd' — disables days after this
  disabled?: boolean
  className?: string
}
```

It is a controlled component, like the existing `SelectField`/`ComboboxField` — not compatible with React Hook Form's `register()` directly. Every usage wraps it in `Controller`.

Internally:
- Parses the incoming `value` string with `date-fns` `parse(value, 'yyyy-MM-dd', new Date())` (avoids timezone-shift bugs that `new Date(string)` can introduce)
- On a date pick, formats back to `format(date, 'yyyy-MM-dd')` before calling `onChange` — so the value contract is identical to the native input's, and submit payloads need zero changes
- `minDate` / `maxDate` props are parsed the same way before being passed to `react-datepicker`

## Styling

**Trigger field** (`customInput` prop): styled identically to the `Input` primitive — `ring-1 ring-gray-300 rounded-lg shadow-sm`, `focus:ring-2 focus:ring-forest-500`. Displays the picked date formatted as `dd/MM/yyyy`. Read-only (no native typing) to avoid free-text parsing edge cases. Trailing `CalendarIcon` (heroicons). A small "×" clear button appears once a value is set.

**Calendar popup** (`calendarClassName`): `rounded-xl shadow-xl border border-gray-100 p-2`.

**Header** (`renderCustomHeader`): replaces the default header entirely with:
- Prev/next chevron buttons — `text-forest-700 hover:bg-forest-50 rounded-lg p-1 transition-colors duration-150`
- A month `<select>` and a year `<select>` (plain HTML selects, styled by us — `ring-1 ring-gray-200 rounded-md text-sm`) for fast navigation, instead of the library's built-in dropdown (which would need separate CSS-class overrides since it doesn't expose a className hook for dropdown list items)

**Day cells** (`dayClassName`):
- Selected → solid `bg-forest-700 text-white rounded-full`
- Today, unselected → `font-semibold text-forest-700`
- Disabled (outside min/max range) → `text-gray-300 cursor-not-allowed`
- Outside current month → `text-gray-300`

`react-datepicker`'s base stylesheet (`react-datepicker/dist/react-datepicker.css`) is imported once globally for grid/positioning layout only; all visual theming is layered on top via the className hooks above.

**Popup clipping**: the calendar renders through a portal (`portalId="date-picker-portal"`, library creates/reuses the target div) attached to `document.body`, so it is never clipped by `Modal`'s `overflow-y-auto` scrollable body.

## Integration

### Standalone field (no pairing) — `StudentFormModal.tsx`

```tsx
<Controller
  control={control}
  name="date_of_birth"
  render={({ field }) => (
    <DatePicker label="Date of Birth" value={field.value} onChange={field.onChange} maxDate={format(new Date(), 'yyyy-MM-dd')} />
  )}
/>
```

### Paired start/end fields — `SemesterFormModal.tsx`, `AcademicYearFormModal.tsx`

```tsx
const startDate = watch('start_date')

<Controller
  control={control}
  name="start_date"
  rules={{ required: 'Start date is required' }}
  render={({ field }) => (
    <DatePicker label="Start Date *" value={field.value} onChange={field.onChange} error={errors.start_date?.message} />
  )}
/>

<Controller
  control={control}
  name="end_date"
  rules={{ required: 'End date is required' }}
  render={({ field }) => (
    <DatePicker label="End Date *" value={field.value} onChange={field.onChange} error={errors.end_date?.message} minDate={startDate || undefined} />
  )}
/>
```

`SemesterFormModal` additionally has two standalone deadline fields (`registration_deadline`, `marks_submission_deadline`) — same standalone pattern as `date_of_birth`, no min/max guard.

## Files

**Create:**
- `frontend/src/components/ui/date-picker.tsx`

**Modify:**
- `frontend/src/components/SemesterFormModal.tsx` — 4 date fields (start_date, end_date, registration_deadline, marks_submission_deadline)
- `frontend/src/components/StudentFormModal.tsx` — 1 date field (date_of_birth)
- `frontend/src/components/AcademicYearFormModal.tsx` — 2 date fields (start_date, end_date)
- `frontend/package.json` — add `react-datepicker` dependency (current major versions ship their own TypeScript types — do not also add `@types/react-datepicker`, it will conflict)

## Verification

1. `cd frontend && npm install react-datepicker` then `npx tsc --noEmit` — zero errors
2. Open each of the 3 modals in the running app: confirm the calendar popup is themed (forest selected day, custom header), not the library default
3. In SemesterFormModal and AcademicYearFormModal: pick a start date, confirm end-date calendar greys out days before it
4. In StudentFormModal: confirm date_of_birth calendar disables future dates
5. Confirm the calendar popup is not visually clipped when the modal body is scrolled
6. Submit a form with a picked date — confirm the API payload still receives `yyyy-MM-dd` (no backend/payload changes needed)
