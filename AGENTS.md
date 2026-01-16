# University of Tsukuba Graduation Requirement Checker - Implementation Plan Overview

## Project Overview

A web application for University of Tsukuba students to check their graduation requirements. It reads CSV data exported from TWINS and visualizes the achievement status of graduation requirements.

## Tech Stack

- **Framework**: SolidStart + SolidUI
- **Styling**: TailwindCSS
- **Database**: IndexedDB (In-browser persistence)
- **Course Data Source**: kdb-crawler ([https://raw.githubusercontent.com/s7tya/kdb-crawler/master/dist/kdb.json](https://raw.githubusercontent.com/s7tya/kdb-crawler/master/dist/kdb.json))

## Key Features

### Tab 1: Graduation Requirement Checker

1. **Import TWINS CSV Data**: Parse and load course history.
2. **Achievement Status Visualization**: Display progress using donut charts, etc.
3. **Detailed Requirements**: Show achievement status for each specific requirement category.
4. **Customization**: Support for different colleges (Gakurui) and admission years.
5. **Export/Import Requirements**: Share graduation requirement definitions via JSON.

### Tab 2: 4-Year Course Management

1. **Semester Management**: Manage courses for each semester over 4 years.
2. **Grade Integration**: Reflect grades from TWINS data.
3. **Credit Visualization**: Visualize credit acquisition progress.
4. **Planning Support**: Assist in creating future course plans.

## Data Structure Overview

### Input Data

- **TWINS CSV**: Student ID, Course ID, Course Name, Credits, Grade, etc.
- **kdb.json**: Course details (Course ID, Course Name, Credits, Semester, etc.).

### Saved Data (IndexedDB)

- Graduation Requirement Definitions (JSON)
- User's Course Data
- Settings & Preferences

## Screen Layout

```text
┌─────────────────────────────────────────┐
│  Header: Logo + Export/Import           │
├─────────────────────────────────────────┤
│  Tabs: [Graduation Check] [Course Mgmt] │
├─────────────────────────────────────────┤
│                                         │
│  Main Content Area                      │
│                                         │
└─────────────────────────────────────────┘
```

## File Structure

```text
src/
├── routes/
│   ├── index.tsx              # Main Page
│   └── [...404].tsx
├── components/
│   ├── ui/                    # SolidUI Components
│   ├── GraduationChecker/     # Graduation check related components
│   │   ├── RequirementEditor.tsx
│   │   ├── RequirementChart.tsx
│   │   ├── RequirementDetail.tsx
│   │   └── CsvUploader.tsx
│   └── CourseManager/         # Course management related components
│       ├── SemesterView.tsx
│       ├── CourseCard.tsx
│       └── CourseSearch.tsx
├── lib/
│   ├── utils.ts
│   ├── db/                    # IndexedDB operations
│   │   ├── index.ts
│   │   ├── requirements.ts
│   │   └── courses.ts
│   ├── parsers/               # Data parsers
│   │   ├── twins-csv.ts
│   │   └── kdb.ts
│   └── types/                 # TypeScript definitions
│       ├── requirements.ts
│       ├── course.ts
│       └── twins.ts
└── stores/                    # State management
    ├── requirements.ts
    └── courses.ts
```

## SolidUI

- UI components adopt SolidUI ([https://www.solid-ui.com/](https://www.solid-ui.com/)).
- Use `npx solidui-cli@latest add [ID]` to copy any component into the project.
- The list of components is shown below.

| Component Name      | ID (Install)      | Description                                                                                        |
| :------------------ | :---------------- | :------------------------------------------------------------------------------------------------- |
| **Accordion**       | `accordion`       | A vertically stacked set of interactive headings that each reveal a section of content.            |
| **Alert**           | `alert`           | Displays a callout for user attention.                                                             |
| **Alert Dialog**    | `alert-dialog`    | A modal dialog that interrupts the user with important content and expects a response.             |
| **Aspect Ratio**    | `aspect-ratio`    | Displays content within a desired ratio.                                                           |
| **Avatar**          | `avatar`          | An image element with a fallback for representing the user.                                        |
| **Badge**           | `badge`           | Displays a badge or a component that looks like a badge.                                           |
| **Badge Delta**     | `badge-delta`     | Displays a badge with a delta indicator (Positive/Negative).                                       |
| **Bar List**        | `bar-list`        | Horizontal bars with a customizable label inside.                                                  |
| **Breadcrumb**      | `breadcrumb`      | Displays the path to the current resource using a hierarchy of links.                              |
| **Button**          | `button`          | Displays a button or a component that looks like a button.                                         |
| **Callout**         | `callout`         | Displays a callout for user attention or short messages.                                           |
| **Card**            | `card`            | Displays a card with header, content, and footer.                                                  |
| **Carousel**        | `carousel`        | A carousel with motion and swipe built using Embla.                                                |
| **Charts**          | `charts`          | A collection of different chart components using Chart.js.                                         |
| **Checkbox**        | `checkbox`        | A control that allows the user to toggle between checked and not checked.                          |
| **Collapsible**     | `collapsible`     | An interactive component which expands/collapses a panel.                                          |
| **Combobox**        | `combobox`        | Autocomplete input and command palette with a list of suggestions.                                 |
| **Command**         | `command`         | Fast, composable, unstyled command menu for React.                                                 |
| **Context Menu**    | `context-menu`    | Displays a menu to the user — usually a list of actions or functions — triggered by a right-click. |
| **Date Picker**     | `date-picker`     | A date picker component with range and presets.                                                    |
| **Delta Bar**       | `delta-bar`       | Visualizes positive or negative values with directed bars.                                         |
| **Dialog**          | `dialog`          | A window overlaid on either the primary window or another dialog window.                           |
| **Drawer**          | `drawer`          | A drawer component that slides out from the edge of the screen.                                    |
| **Dropdown Menu**   | `dropdown-menu`   | Displays a menu to the user — such as a set of actions or functions — triggered by a button.       |
| **Flex**            | `flex`            | Creates a flex container which enables flex context for all its direct children.                   |
| **Grid**            | `grid`            | Creates a grid container for layout.                                                               |
| **Hover Card**      | `hover-card`      | For sighted users to preview content available behind a link.                                      |
| **Label**           | `label`           | Renders an accessible label associated with controls.                                              |
| **Menubar**         | `menubar`         | A visually persistent menu common in desktop applications.                                         |
| **Navigation Menu** | `navigation-menu` | A collection of links for navigating websites.                                                     |
| **Number Field**    | `number-field`    | A specialized input field for numeric values.                                                      |
| **OTP Field**       | `otp-field`       | An input field for One-Time Passwords (OTP).                                                       |
| **Pagination**      | `pagination`      | Pagination with page navigation, next and previous links.                                          |
| **Popover**         | `popover`         | Displays rich content in a portal, triggered by a button.                                          |
| **Progress**        | `progress`        | Displays an indicator showing the completion progress of a task.                                   |
| **Progress Circle** | `progress-circle` | A circular progress indicator.                                                                     |
| **Radio Group**     | `radio-group`     | A set of checkable buttons where no more than one can be checked at a time.                        |
| **Resizable**       | `resizable`       | Accessible resizable panel groups and layouts.                                                     |
| **Select**          | `select`          | Displays a list of options for the user to pick from—triggered by a button.                        |
| **Separator**       | `separator`       | Visually or semantically separates content.                                                        |
| **Sheet**           | `sheet`           | Extends the Dialog component to display content that complements the main screen.                  |
| **Sidebar**         | `sidebar`         | A composable, themeable and customizable sidebar component.                                        |
| **Skeleton**        | `skeleton`        | Used to show a placeholder while content is loading.                                               |
| **Slider**          | `slider`          | An input where the user selects a value from within a given range.                                 |
| **Sonner**          | `sonner`          | An opinionated toast component.                                                                    |
| **Switch**          | `switch`          | A control that allows the user to toggle between checked and not checked.                          |
| **Table**           | `table`           | A responsive table component.                                                                      |
| **Tabs**            | `tabs`            | A set of layered sections of content—known as tab panels—that are displayed one at a time.         |
| **Text Field**      | `text-field`      | Displays a form input field or a component that looks like an input field.                         |
| **Timeline**        | `timeline`        | Visualizes events in a chronological order.                                                        |
| **Toast**           | `toast`           | A succinct message that is displayed temporarily.                                                  |
| **Toggle**          | `toggle`          | A two-state button that can be either on or off.                                                   |
| **Toggle Group**    | `toggle-group`    | A set of two-state buttons that can be toggled on or off.                                          |
| **Tooltip**         | `tooltip`         | A popup that displays information related to an element when hovered or focused.                   |

## Git Operations

- Please commit in Japanese at the timing of feature-by-feature, document updates, library updates, etc.
- Push operations and reset operations are prohibited.

## Shell Operations (Character encoding error instructions for Codex)

**Rule:** In each command, **define → use**. Do **not** escape `$`. Use generic `'path/to/file.ext'`.

---

### 1) READ (UTF‑8 no BOM, line‑numbered)

```bash
bash -lc 'powershell -NoLogo -Command "
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false);
Set-Location -LiteralPath (Convert-Path .);
function Get-Lines { param([string]$Path,[int]$Skip=0,[int]$First=40)
  $enc=[Text.UTF8Encoding]::new($false)
  $text=[IO.File]::ReadAllText($Path,$enc)
  if($text.Length -gt 0 -and $text[0] -eq [char]0xFEFF){ $text=$text.Substring(1) }
  $ls=$text -split \"`r?`n\"
  for($i=$Skip; $i -lt [Math]::Min($Skip+$First,$ls.Length); $i++){ \"{0:D4}: {1}\" -f ($i+1), $ls[$i] }
}
Get-Lines -Path \"path/to/file.ext\" -First 120 -Skip 0
"'
```

---

### 2) WRITE (UTF‑8 no BOM, atomic replace, backup)

```bash
bash -lc 'powershell -NoLogo -Command "
$OutputEncoding = [Console]::OutputEncoding = [Text.UTF8Encoding]::new($false);
Set-Location -LiteralPath (Convert-Path .);
function Write-Utf8NoBom { param([string]$Path,[string]$Content)
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  $tmp = [IO.Path]::GetTempFileName()
  try {
    $enc = [Text.UTF8Encoding]::new($false)
    [IO.File]::WriteAllText($tmp,$Content,$enc)
    Move-Item $tmp $Path -Force
  }
  finally {
    if (Test-Path $tmp) {
      Remove-Item $tmp -Force -ErrorAction SilentlyContinue
    }
  }
}
$file = "path/to/your_file.ext"
$enc  = [Text.UTF8Encoding]::new($false)
$old  = (Test-Path $file) ? ([IO.File]::ReadAllText($file,$enc)) : ''
Write-Utf8NoBom -Path $file -Content ($old+"`nYOUR_TEXT_HERE`n")
"'
```
