<!-- d609a76b-4ae7-40bb-adc0-46518b1934d4 6cdc8547-ac96-4f41-9351-2a7ad2df255b -->
# Enhanced Live Dashboard Implementation Plan

## Phase 1: Dependencies & Setup

### 1.1 Install Required Dependencies

Update `package.json` to add:

- `recharts: ^2.8.0` - Chart library
- `react-spring: ^9.7.3` - Animation library

Run `npm install` to install new dependencies.

### 1.2 Create Database Migration for Materialized Views

Create `supabase/migrations/20250129000000_add_dashboard_materialized_views.sql`:

- `daily_transactions_agg` - Daily income/expense aggregates
- `monthly_category_agg` - Monthly category totals
- `budget_utilization` - Real-time budget usage percentages
- Indexes for performance
- `refresh_dashboard_views()` function for scheduled updates

## Phase 2: Core Dashboard Components

### 2.1 Live KPI Cards with Micro Sparklines

Create `src/components/dashboard/LiveKPICards.tsx`:

- Fetch today's spend, MTD income, MTD expense, net profit
- Embed micro sparklines (7-day trend) using Recharts `<LineChart>`
- Animate values with React Spring `useSpring`
- Real-time Supabase subscription to transactions table
- Debounce updates: 1000ms + 2000ms live indicator
- Show period-over-period comparison on hover
- Color coding: Blue (income), Green (healthy), Orange (warning), Red (danger)

### 2.2 Compact Charts Grid

Create `src/components/dashboard/CompactCharts.tsx`:

- **Category Donut**: Top 6 categories with Recharts `<PieChart>`, click to drill-down
- **Budget Gauge**: Mini donut showing % used with color thresholds (<70% green, 70-95% orange, >95% red)
- **Top Vendors Bar**: Horizontal `<BarChart>` for top 5 vendors
- **Cash Flow Mini**: 30-day `<AreaChart>` with income/expense overlay
- Grid layout: `grid-cols-1 lg:grid-cols-2 xl:grid-cols-4`
- Hover tooltips with detailed data
- Click handlers for modal drill-down

### 2.3 Smart Time Slider

Create `src/components/dashboard/SmartTimeSlider.tsx`:

- Draggable slider with pan (default) and zoom (with Shift/Ctrl modifier keys)
- Quick range buttons: Today, 7d, 30d, 90d, 1yr
- Zoom in/out controls (+/- buttons)
- Animated slider position with React Spring
- Display current range: `{start date} - {end date} ({label})`
- Export `TimeRange` interface: `{ start: Date, end: Date, label: string, type: 'day'|'week'|'month'|'quarter'|'year' }`

### 2.4 Cross-Business Filter

Create `src/components/dashboard/CrossBusinessFilter.tsx`:

- Toggle switches for each business (lucide-react `ToggleLeft`/`ToggleRight`)
- Color-coded business indicators (6-color palette)
- Compare mode toggle: overlaid vs side-by-side grid
- Select All / Clear All quick actions
- Show selected count: "2 of 5 businesses selected"
- Smooth toggle animations with React Spring

### 2.5 Heatmap Calendar

Create `src/components/dashboard/HeatmapCalendar.tsx`:

- 90-day calendar grid showing spending intensity
- Color scale: 5 levels from gray to dark blue
- Click day → open transactions modal filtered by date
- Hover tooltip showing date + amount
- Responsive grid: 7 columns (Sun-Sat)

### 2.6 Live P&L Badge

Create `src/components/dashboard/LivePLBadge.tsx`:

- Large animated number showing net profit (current period)
- Arrow icon + percentage vs previous period
- Color coding: Green (positive), Red (negative)
- Click → opens full P&L report modal
- Real-time updates via Supabase subscription

### 2.7 AI Insight Card

Create `src/components/dashboard/AIInsightCard.tsx`:

- Placeholder for AI-generated insights
- Mock insights: revenue trends, expense alerts, cash flow optimization
- Icon indicators: `TrendingUp` (positive), `AlertTriangle` (warning), `Lightbulb` (info)
- "View Details" CTA button
- API endpoint placeholder: `/api/insights?businessId=...&range=...`

## Phase 3: On-Demand Reports

### 3.1 Reports Modal/Tab System

Create `src/components/reports/ReportsTabs.tsx`:

- Tab navigation: Weekly, Monthly, Quarterly, Annual, Budget Analysis, Multi-Business, Personal
- Header controls: Business selector, Time range selector, Export button
- Lazy load report components on tab open
- Smooth tab transitions with React Spring

### 3.2 Individual Report Components

Create report components:

- `src/components/reports/WeeklyReport.tsx` - Daily breakdown with area charts
- `src/components/reports/MonthlyReport.tsx` - Category breakdown, trend analysis
- `src/components/reports/QuarterlyReport.tsx` - Quarter-over-quarter comparison
- `src/components/reports/AnnualReport.tsx` - Year-over-year analysis
- `src/components/reports/BudgetAnalysisReport.tsx` - Budget vs actual with variance
- `src/components/reports/MultiBusinessReport.tsx` - Side-by-side comparison charts
- `src/components/reports/PersonalFinanceReport.tsx` - Personal spending analysis

Each report includes:

- Large detailed charts (Recharts with full interactivity)
- Summary stats cards
- Export functionality
- Print-friendly layout

### 3.3 Reports Modal Container

Create `src/components/dashboard/ReportsModal.tsx`:

- Full-screen modal with smooth enter/exit animations
- Header: Report title, Compare toggle, Export, Close button
- Controls: Time range selector, Business filter
- Dynamic chart rendering based on report type
- Footer: Summary stats (total records, time range, last updated)

## Phase 4: API Endpoints

### 4.1 Daily Aggregates API

Create `app/api/agg/daily/route.ts`:

- GET endpoint accepting `businessId` and `range` query params
- Query transactions or use materialized view `daily_transactions_agg`
- Return: `[{ date, total_income, total_expense, net_profit }]`
- Add comment: "TODO: Use materialized view for production"

### 4.2 Monthly Aggregates API

Create `app/api/agg/monthly/route.ts`:

- GET endpoint for monthly category aggregates
- Query params: `businessId`, `range`
- Use materialized view `monthly_category_agg`
- Return: `[{ month, category, total_amount, transaction_count }]`

### 4.3 AI Insights API

Create `app/api/insights/route.ts`:

- GET endpoint accepting `businessId` and `range`
- Mock insights for now (3 sample insights)
- Return: `{ id, type, title, description, confidence, action, category }`
- Add TODO comment for LLM integration (OpenAI, Anthropic, etc.)

## Phase 5: Integration & Enhancement

### 5.1 Update DashboardMock Component

Modify `src/components/DashboardMock.tsx`:

- Add state for time range and selected businesses
- Import and render new dashboard components
- Pass time range and business filters as props
- Wire up modal triggers (category click → category detail modal)
- Maintain existing expense entry widget at top

### 5.2 Update ReportsPage Component

Modify `src/components/ReportsPage.tsx`:

- Replace with new `ReportsTabs` component
- Remove old static charts
- Add modal support for drill-down views

### 5.3 Real-time Subscriptions Setup

In dashboard components:

- Subscribe to `postgres_changes` on transactions table
- Filter by `business_id` from selected businesses
- Debounce updates: 1000ms delay before refetch
- Show live indicator (green pulse) during updates
- Clean up subscriptions on unmount

### 5.4 Enhanced Tooltips

For all charts:

- Custom tooltip component with dark theme
- Show formatted currency values
- Display date/category/vendor info
- Match color scheme (royal blue background)

## Phase 6: Mobile & Accessibility

### 6.1 Responsive Design

- KPI cards: `grid-cols-2 lg:grid-cols-4`
- Charts: `grid-cols-1 lg:grid-cols-2 xl:grid-cols-4`
- Collapsible sections on mobile (accordion pattern)
- Touch-friendly tap targets (min 48px)
- Horizontal scroll for time slider on mobile

### 6.2 Accessibility

- Add ARIA labels to all charts and interactive elements
- Keyboard navigation for tabs and toggles
- Focus indicators (2px blue outline)
- Screen reader text for chart data points
- High contrast mode support

## Phase 7: Performance & Testing

### 7.1 Performance Optimizations

- Lazy load report components with `React.lazy()`
- Memoize chart props with `useMemo`
- Debounce real-time updates (1000-1500ms)
- Use materialized views for historical data
- Client-side aggregation for real-time data

### 7.2 Documentation

Update `README.md`:

- Add setup instructions for new dependencies
- Document API endpoints
- Explain materialized views setup
- List Supabase Realtime requirements
- Mobile responsiveness notes
- Accessibility features

## Phase 8: Final Touches

### 8.1 Color Consistency

Ensure throughout:

- Blue (#4F7CFF) for income
- Green (#10b981) for healthy/under budget
- Orange (#f59e0b) for warnings
- Red (#ef4444) for overspend/loss
- Dark backgrounds (#0f1729, #1a1d35, #1a1d2e)

### 8.2 Animation Polish

- Smooth chart transitions (no reloads)
- Spring easing on number changes (tension: 300, friction: 30)
- Hover states with 200ms transitions
- Modal enter/exit animations (fade + slide)
- Live indicator pulse animation

### 8.3 Commit & PR

- Commit message: "feat(dashboard): add live in-page reports, budget gauge, category donut, cashflow mini, top vendors, heatmap + on-demand reports tabs"
- PR description: Summarize features, note server-side materialized views, list breaking changes (if any)

### To-dos

- [ ] Install recharts and react-spring dependencies
- [ ] Create materialized views migration with daily/monthly aggregates
- [ ] Build LiveKPICards component with sparklines and real-time subscriptions
- [ ] Build CompactCharts component with donut, bar, and area charts
- [ ] Build SmartTimeSlider with pan+zoom and quick range buttons
- [ ] Build CrossBusinessFilter with toggles and compare mode
- [ ] Build HeatmapCalendar with 90-day grid and click interactions
- [ ] Build LivePLBadge with animated net profit and period comparison
- [ ] Build AIInsightCard with mock insights and API placeholder
- [ ] Build ReportsTabs system with tab navigation and lazy loading
- [ ] Create all 7 report components (Weekly, Monthly, Quarterly, Annual, Budget, Multi-Business, Personal)
- [ ] Build ReportsModal with full-screen layout and animations
- [ ] Create API routes for daily aggregates, monthly aggregates, and AI insights
- [ ] Integrate all dashboard components into DashboardMock with state management
- [ ] Replace ReportsPage with new ReportsTabs component
- [ ] Ensure mobile-first responsive design across all components
- [ ] Add ARIA labels, keyboard navigation, and focus indicators
- [ ] Update README with setup instructions, API docs, and features list