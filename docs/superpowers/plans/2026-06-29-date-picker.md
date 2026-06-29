# Forest Academy Date Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 7 native `<input type="date">` fields in ARTAS with a single reusable, Forest Academy–themed `DatePicker` component built on `react-datepicker`.

**Architecture:** One new controlled component (`frontend/src/components/ui/date-picker.tsx`) wraps `react-datepicker`, restyling it via `customInput`, `calendarClassName`, `dayClassName`, and `renderCustomHeader`. It is integrated into 3 existing modals via React Hook Form's `Controller` (the same pattern already used for `SelectField`/`ComboboxField`).

**Tech Stack:** React 18, TypeScript, `react-datepicker` (new dependency), `date-fns` (already installed, used for parse/format), Tailwind CSS, HeadlessUI (`Field`/`Label`/`Description`, matching the existing `Input` primitive).

## Global Constraints

- Value format in/out of the component stays `'yyyy-MM-dd'` — identical to what the native `<input type="date">` produced. No downstream submit-handler or API-payload code changes.
- Display format shown to the user is `'dd/MM/yyyy'`.
- Do not add `@types/react-datepicker` — current major versions of `react-datepicker` ship their own TypeScript types; adding the separate `@types` package will conflict.
- This frontend has **no unit test runner** (no jest/vitest configured — only `tsc` and `vite build`/`lint`). Every task's verification step is `npx tsc --noEmit` (must report zero errors) plus a manual check described in the task. Do not attempt to add a test framework as part of this plan — out of scope.
- Calendar popup must render via `portalId="date-picker-portal"` so it is not clipped by `Modal`'s `overflow-y-auto` body.
- No month-only or year-only picker modes — day-grid only, per the approved spec (`docs/superpowers/specs/2026-06-29-date-picker-design.md`).

---

### Task 1: Add `react-datepicker` dependency

**Files:**
- Modify: `frontend/package.json`

**Interfaces:**
- Produces: `react-datepicker` package available for import in Task 2.

- [ ] **Step 1: Install the package**

Run from `frontend/`:
```bash
npm install react-datepicker
```

- [ ] **Step 2: Verify it installed without a separate types package**

Run: `grep -n "react-datepicker" package.json`
Expected output: one line under `dependencies` like `"react-datepicker": "^7.x.x"` — and NOT `@types/react-datepicker` anywhere in the file.

- [ ] **Step 3: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: exits with no output (zero errors) — confirms the package ships usable types.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-datepicker dependency"
```

---

### Task 2: Build the `DatePicker` UI primitive

**Files:**
- Create: `frontend/src/components/ui/date-picker.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks except the `react-datepicker` package from Task 1.
- Produces: `DatePicker` component with this exact signature, used by Tasks 3-5:
  ```ts
  interface DatePickerProps {
      label?: string
      value: string | null | undefined   // 'yyyy-MM-dd'
      onChange: (value: string) => void  // emits 'yyyy-MM-dd' or '' when cleared
      error?: string
      description?: string
      placeholder?: string
      minDate?: string                   // 'yyyy-MM-dd'
      maxDate?: string                   // 'yyyy-MM-dd'
      disabled?: boolean
      className?: string
  }
  export function DatePicker(props: DatePickerProps): JSX.Element
  ```

- [ ] **Step 1: Create the file with the full implementation**

Create `frontend/src/components/ui/date-picker.tsx`:

```tsx
import React, { forwardRef, useMemo } from 'react'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format, parse, isValid } from 'date-fns'
import { Field, Label, Description } from '@headlessui/react'
import { CalendarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const DATE_VALUE_FORMAT = 'yyyy-MM-dd'
const DATE_DISPLAY_FORMAT = 'dd/MM/yyyy'

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function parseValue(value: string | null | undefined): Date | null {
    if (!value) return null
    const parsed = parse(value, DATE_VALUE_FORMAT, new Date())
    return isValid(parsed) ? parsed : null
}

function getYearOptions(): number[] {
    const currentYear = new Date().getFullYear()
    const years: number[] = []
    for (let y = currentYear + 10; y >= currentYear - 100; y--) years.push(y)
    return years
}

const YEAR_OPTIONS = getYearOptions()

const triggerBase =
    'flex w-full items-center justify-between rounded-lg border-0 py-2 px-3 text-sm text-left text-gray-900 ' +
    'ring-1 ring-inset ring-gray-300 shadow-sm cursor-pointer ' +
    'focus:ring-2 focus:ring-inset focus:ring-forest-500 focus:outline-none ' +
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ' +
    'transition-shadow duration-150'

const triggerError = 'ring-red-400 focus:ring-red-500'

interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    displayValue?: string
    placeholder?: string
    error?: boolean
    onClear?: () => void
}

const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(function Trigger(
    { displayValue, placeholder = 'Select date', error, onClear, className, ...props },
    ref
) {
    return (
        <button
            type="button"
            ref={ref}
            className={clsx(triggerBase, error && triggerError, className)}
            {...props}
        >
            <span className={clsx(!displayValue && 'text-gray-400')}>
                {displayValue || placeholder}
            </span>
            <span className="flex items-center gap-1 flex-shrink-0 ml-2">
                {displayValue && onClear && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation()
                            onClear()
                        }}
                        className="text-gray-300 hover:text-gray-500 transition-colors duration-150"
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </span>
                )}
                <CalendarIcon className="h-4 w-4 text-gray-400" />
            </span>
        </button>
    )
})

interface DatePickerProps {
    label?: string
    value: string | null | undefined
    onChange: (value: string) => void
    error?: string
    description?: string
    placeholder?: string
    minDate?: string
    maxDate?: string
    disabled?: boolean
    className?: string
}

export function DatePicker({
    label,
    value,
    onChange,
    error,
    description,
    placeholder,
    minDate,
    maxDate,
    disabled,
    className,
}: DatePickerProps) {
    const selected = useMemo(() => parseValue(value), [value])
    const min = useMemo(() => parseValue(minDate), [minDate])
    const max = useMemo(() => parseValue(maxDate), [maxDate])

    return (
        <Field className={className}>
            {label && (
                <Label className="text-sm font-medium text-gray-700 mb-1 block">
                    {label}
                </Label>
            )}
            <ReactDatePicker
                selected={selected}
                onChange={(date) => onChange(date ? format(date, DATE_VALUE_FORMAT) : '')}
                minDate={min ?? undefined}
                maxDate={max ?? undefined}
                disabled={disabled}
                dateFormat={DATE_DISPLAY_FORMAT}
                portalId="date-picker-portal"
                calendarClassName="rounded-xl shadow-xl border border-gray-100 p-2 font-sans"
                dayClassName={(date) => {
                    if (selected && date.toDateString() === selected.toDateString()) {
                        return 'bg-forest-700 text-white rounded-full hover:bg-forest-700'
                    }
                    if (date.toDateString() === new Date().toDateString()) {
                        return 'font-semibold text-forest-700'
                    }
                    return ''
                }}
                renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                }) => (
                    <div className="flex items-center justify-between px-2 py-1">
                        <button
                            type="button"
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="p-1 rounded-lg text-forest-700 hover:bg-forest-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-1.5">
                            <select
                                value={date.getMonth()}
                                onChange={(e) => changeMonth(Number(e.target.value))}
                                className="text-sm rounded-md ring-1 ring-gray-200 border-0 py-1 pl-2 pr-6 text-gray-700 focus:ring-2 focus:ring-forest-500 focus:outline-none"
                            >
                                {MONTH_NAMES.map((name, i) => (
                                    <option key={name} value={i}>{name}</option>
                                ))}
                            </select>
                            <select
                                value={date.getFullYear()}
                                onChange={(e) => changeYear(Number(e.target.value))}
                                className="text-sm rounded-md ring-1 ring-gray-200 border-0 py-1 pl-2 pr-6 text-gray-700 focus:ring-2 focus:ring-forest-500 focus:outline-none"
                            >
                                {YEAR_OPTIONS.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="p-1 rounded-lg text-forest-700 hover:bg-forest-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}
                customInput={
                    <Trigger
                        displayValue={selected ? format(selected, DATE_DISPLAY_FORMAT) : ''}
                        placeholder={placeholder}
                        error={!!error}
                        onClear={() => onChange('')}
                    />
                }
            />
            {description && !error && (
                <Description className="text-xs text-gray-500 mt-1">
                    {description}
                </Description>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </Field>
    )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: zero errors. If `react-datepicker`'s types report a mismatch on `renderCustomHeader` params, double-check the destructured prop names against the installed version's `.d.ts` (the package exports `ReactDatePickerCustomHeaderProps` — the names above match v6/v7).

- [ ] **Step 3: Manual smoke test in isolation**

Run: `cd frontend && npm run dev`
Temporarily add `<DatePicker value="" onChange={console.log} label="Test" />` to any page you can reach in the browser (e.g. paste it at the top of `DashboardPage.tsx`'s return JSX), open it in the browser, confirm:
- Clicking the trigger opens a themed calendar (rounded corners, forest header buttons, month/year dropdowns)
- Clicking a day closes the calendar and shows the date as `dd/MM/yyyy` in the trigger
- The "×" clear button appears once a date is set and clears it when clicked

Remove the temporary test snippet from `DashboardPage.tsx` afterward — do not commit it.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/date-picker.tsx
git commit -m "feat(ui): add Forest Academy themed DatePicker primitive"
```

---

### Task 3: Migrate `StudentFormModal.tsx` (standalone field, max-date guard)

**Files:**
- Modify: `frontend/src/components/StudentFormModal.tsx`

**Interfaces:**
- Consumes: `DatePicker` from Task 2 (`./ui/date-picker`).

- [ ] **Step 1: Add the import**

In `frontend/src/components/StudentFormModal.tsx`, add to the imports (alongside the existing `import { Input } from './ui/input'` line):
```tsx
import { DatePicker } from './ui/date-picker'
import { format } from 'date-fns'
```

- [ ] **Step 2: Replace the native date input**

Find this block (currently using `register`):
```tsx
<Input
    label="Date of Birth"
    type="date"
    {...register('date_of_birth')}
/>
```

Replace it with:
```tsx
<Controller
    control={control}
    name="date_of_birth"
    render={({ field }) => (
        <DatePicker
            label="Date of Birth"
            value={field.value}
            onChange={field.onChange}
            maxDate={format(new Date(), 'yyyy-MM-dd')}
        />
    )}
/>
```

`Controller` is already imported in this file (used elsewhere for `SelectField`/`ComboboxField`) — do not add a duplicate import.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Manual verification**

Run: `cd frontend && npm run dev`, log in, open the Students page, click "Add Student". Confirm:
- The "Date of Birth" field shows the themed `DatePicker` trigger, not a native date input
- Dates after today are disabled (greyed out, unclickable) in the calendar
- Picking a date and submitting the form still saves successfully (check the network request payload contains `date_of_birth: "yyyy-MM-dd"`)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/StudentFormModal.tsx
git commit -m "feat(ui): migrate StudentFormModal date_of_birth to DatePicker"
```

---

### Task 4: Migrate `AcademicYearFormModal.tsx` (paired start/end, min-date guard)

**Files:**
- Modify: `frontend/src/components/AcademicYearFormModal.tsx`

**Interfaces:**
- Consumes: `DatePicker` from Task 2 (`./ui/date-picker`).

- [ ] **Step 1: Add the import and a `watch` for the start date**

Add to imports:
```tsx
import { DatePicker } from './ui/date-picker'
```

Change this line:
```tsx
const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AcademicYearFormData>({
    defaultValues: { year: new Date().getFullYear(), is_current: false }
})
```
to also destructure `watch`:
```tsx
const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<AcademicYearFormData>({
    defaultValues: { year: new Date().getFullYear(), is_current: false }
})
```

Immediately after that line, add:
```tsx
const startDate = watch('start_date')
```

- [ ] **Step 2: Replace the two native date inputs**

Find:
```tsx
<Input
    label="Start Date *"
    type="date"
    {...register('start_date', { required: 'Start date is required' })}
    error={errors.start_date?.message}
/>

<Input
    label="End Date *"
    type="date"
    {...register('end_date', { required: 'End date is required' })}
    error={errors.end_date?.message}
/>
```

Replace with:
```tsx
<Controller
    control={control}
    name="start_date"
    rules={{ required: 'Start date is required' }}
    render={({ field }) => (
        <DatePicker
            label="Start Date *"
            value={field.value}
            onChange={field.onChange}
            error={errors.start_date?.message}
        />
    )}
/>

<Controller
    control={control}
    name="end_date"
    rules={{ required: 'End date is required' }}
    render={({ field }) => (
        <DatePicker
            label="End Date *"
            value={field.value}
            onChange={field.onChange}
            error={errors.end_date?.message}
            minDate={startDate || undefined}
        />
    )}
/>
```

`Controller` is already imported in this file. Do not remove the `register` import — it is still used for `name` and `year` fields.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Manual verification**

Run the dev server, open Academic Years management, click "Add Academic Year". Confirm:
- Both date fields show the themed `DatePicker`
- Before picking a start date, the end-date calendar has no day restrictions
- After picking a start date (e.g. 1 Jan 2026), opening the end-date calendar shows all days before 1 Jan 2026 greyed out and unclickable
- Submitting still saves successfully with `yyyy-MM-dd` values in the payload

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AcademicYearFormModal.tsx
git commit -m "feat(ui): migrate AcademicYearFormModal dates to DatePicker with range guard"
```

---

### Task 5: Migrate `SemesterFormModal.tsx` (paired + two standalone deadline fields)

**Files:**
- Modify: `frontend/src/components/SemesterFormModal.tsx`

**Interfaces:**
- Consumes: `DatePicker` from Task 2 (`./ui/date-picker`).

- [ ] **Step 1: Add the import and a `watch` for the start date**

Add to imports:
```tsx
import { DatePicker } from './ui/date-picker'
```

Change:
```tsx
const { register, handleSubmit, reset, control, formState: { errors } } = useForm<SemesterFormData>({
    defaultValues: { semester_type: 'first', year: new Date().getFullYear(), is_active: true }
})
```
to:
```tsx
const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<SemesterFormData>({
    defaultValues: { semester_type: 'first', year: new Date().getFullYear(), is_active: true }
})
```

Immediately after, add:
```tsx
const startDate = watch('start_date')
```

- [ ] **Step 2: Replace all 4 native date inputs**

Find:
```tsx
<Input
    label="Start Date *"
    type="date"
    {...register('start_date', { required: 'Start date is required' })}
    error={errors.start_date?.message}
/>

<Input
    label="End Date *"
    type="date"
    {...register('end_date', { required: 'End date is required' })}
    error={errors.end_date?.message}
/>

<Input
    label="Registration Deadline"
    type="date"
    {...register('registration_deadline')}
/>

<Input
    label="Marks Deadline"
    type="date"
    {...register('marks_submission_deadline')}
/>
```

Replace with:
```tsx
<Controller
    control={control}
    name="start_date"
    rules={{ required: 'Start date is required' }}
    render={({ field }) => (
        <DatePicker
            label="Start Date *"
            value={field.value}
            onChange={field.onChange}
            error={errors.start_date?.message}
        />
    )}
/>

<Controller
    control={control}
    name="end_date"
    rules={{ required: 'End date is required' }}
    render={({ field }) => (
        <DatePicker
            label="End Date *"
            value={field.value}
            onChange={field.onChange}
            error={errors.end_date?.message}
            minDate={startDate || undefined}
        />
    )}
/>

<Controller
    control={control}
    name="registration_deadline"
    render={({ field }) => (
        <DatePicker
            label="Registration Deadline"
            value={field.value}
            onChange={field.onChange}
        />
    )}
/>

<Controller
    control={control}
    name="marks_submission_deadline"
    render={({ field }) => (
        <DatePicker
            label="Marks Deadline"
            value={field.value}
            onChange={field.onChange}
        />
    )}
/>
```

`Controller` is already imported. The `register` import is still used for the `name` and `year` text/number fields — do not remove it.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Manual verification**

Run the dev server, open Semesters management, click "Add Semester". Confirm:
- All 4 date fields show the themed `DatePicker`
- Start/End date range guard works the same as Task 4
- Registration Deadline and Marks Deadline have no min/max restriction (they're standalone)
- Submitting saves successfully; the existing `registration_deadline || undefined` / `marks_submission_deadline || undefined` handling in the `onSubmit` wrapper (already in the file, unchanged) still correctly omits empty deadline fields from the payload

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/SemesterFormModal.tsx
git commit -m "feat(ui): migrate SemesterFormModal dates to DatePicker with range guard"
```

---

### Task 6: Final cross-check

**Files:** none (verification only)

- [ ] **Step 1: Confirm no native date inputs remain in the 3 migrated files**

Run:
```bash
grep -n "type=\"date\"" frontend/src/components/StudentFormModal.tsx frontend/src/components/AcademicYearFormModal.tsx frontend/src/components/SemesterFormModal.tsx
```
Expected: no output (zero matches).

- [ ] **Step 2: Full TypeScript check**

Run: `cd frontend && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Visual pass on all 3 modals in the running app**

Open each of the 3 modals (Add Student, Add Academic Year, Add Semester) in the browser and confirm every date field uses the new themed picker, the calendar popup is never clipped (test by scrolling the modal body if the form is tall), and editing an existing record correctly pre-fills the picker with its saved date.

No commit for this task — it's a verification checkpoint only.
