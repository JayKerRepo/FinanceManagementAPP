# Finance Management App

A comprehensive financial management application built with Next.js, React, and Supabase, featuring real-time analytics, AI-powered insights, and multi-business support.

## 🚀 Features

### Live Dashboard
- **Real-time KPI Cards**: Live updates with micro sparklines showing Today's Spend, MTD Income, MTD Expense, and Net Profit
- **Compact Charts**: Category breakdown donut, budget utilization gauge, top vendors bar chart, and cash flow mini chart
- **Smart Time Slider**: Drag-to-zoom time range selector with quick preset buttons
- **Cross-Business Filter**: Toggle between businesses with compare mode for side-by-side analysis
- **Heatmap Calendar**: 90-day spending intensity visualization with click-to-drill functionality
- **Live P&L Badge**: Animated net profit display with period-over-period comparison
- **AI Insight Card**: Smart financial insights powered by AI analysis

### On-Demand Reports
- **Weekly Reports**: Daily breakdown with area charts and trend analysis
- **Monthly Reports**: Category breakdown with pie charts and bar charts
- **Quarterly Reports**: Quarter-over-quarter comparison (coming soon)
- **Annual Reports**: Year-over-year analysis (coming soon)
- **Budget Analysis**: Budget vs actual with variance analysis (coming soon)
- **Multi-Business Reports**: Side-by-side business comparison (coming soon)
- **Personal Finance**: Personal spending analysis (coming soon)

### Technical Features
- **Real-time Updates**: Supabase Realtime subscriptions for live data
- **Materialized Views**: Optimized database queries for better performance
- **Mobile-First Design**: Responsive layout with touch-friendly interactions
- **Accessibility**: ARIA labels, keyboard navigation, and focus indicators
- **Animation**: Smooth transitions with React Spring animations
- **Color Coding**: Consistent theme with Blue (income), Green (healthy), Orange (warning), Red (danger)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Animations**: React Spring
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FinanceManagementAPP
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
# Add your Supabase credentials
```

4. Run database migrations:
```bash
# Apply the materialized views migration
supabase db push
```

5. Start the development server:
```bash
npm run dev
```

## 🗄️ Database Setup

The application uses Supabase with the following key tables:
- `transactions`: Financial transactions with income/expense tracking
- `businesses`: Multi-business support
- `budgets`: Budget management and tracking
- `categories`: Transaction categorization
- `accounts`: Bank account management

### Materialized Views
For optimal performance, the app includes materialized views:
- `daily_transactions_agg`: Daily income/expense aggregates
- `monthly_category_agg`: Monthly category totals
- `budget_utilization`: Real-time budget usage percentages

## 🔌 API Endpoints

### Daily Aggregates
```
GET /api/agg/daily?businessId={id}&range={days}
```
Returns daily transaction aggregates for the specified business and time range.

### Monthly Aggregates
```
GET /api/agg/monthly?businessId={id}&range={days}
```
Returns monthly category aggregates for analysis.

### AI Insights
```
GET /api/insights?businessId={id}&range={period}
```
Returns AI-generated financial insights (currently mock data).

## 📱 Mobile Support

The application is built mobile-first with:
- Responsive grid layouts (1 column on mobile, 2-4 on desktop)
- Touch-friendly tap targets (minimum 48px)
- Horizontal scroll for time sliders
- Collapsible sections for better space utilization

## ♿ Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators with 2px blue outline
- Screen reader support for chart data
- High contrast mode compatibility

## 🎨 Design System

### Colors
- **Blue (#4F7CFF)**: Income, positive values
- **Green (#10b981)**: Healthy, under budget
- **Orange (#f59e0b)**: Warning, overdue
- **Red (#ef4444)**: Overspend, loss, danger
- **Background**: Dark theme with royal blue base (#1a1d35, #0f1729)

### Typography
- Clean, modern font stack
- Consistent sizing scale
- High contrast text for readability

## 🚀 Performance

- Lazy loading for report components
- Memoized chart props with `useMemo`
- Debounced real-time updates (1000-1500ms)
- Materialized views for historical data
- Client-side aggregation for real-time data

## 📈 Future Enhancements

- Complete implementation of all report types
- Advanced AI insights with LLM integration
- Export functionality (PDF, Excel)
- Advanced filtering and search
- Custom dashboard widgets
- Team collaboration features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.