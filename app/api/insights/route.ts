export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const range = searchParams.get('range') || 'month';

    // Input validation
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const validRanges = ['day', 'week', 'month', 'quarter', 'year'];
    if (!validRanges.includes(range)) {
      return NextResponse.json({ error: 'Invalid range. Must be one of: day, week, month, quarter, year' }, { status: 400 });
    }

    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Implement actual AI insights generation
    // This would typically call an LLM service like OpenAI, Anthropic, etc.
    // with financial data analysis prompts
    
    const mockInsights = [
      {
        id: '1',
        type: 'positive',
        title: 'Revenue Growth Trend',
        description: 'Your revenue has grown 15% compared to last month, driven primarily by increased client acquisition.',
        confidence: 0.85,
        action: 'View Revenue Report',
        category: 'revenue'
      },
      {
        id: '2',
        type: 'warning',
        title: 'Expense Category Alert',
        description: 'Office expenses have increased 25% this month. Consider reviewing recurring subscriptions and vendor contracts.',
        confidence: 0.92,
        action: 'Review Expenses',
        category: 'expenses'
      },
      {
        id: '3',
        type: 'info',
        title: 'Cash Flow Optimization',
        description: 'Your cash flow pattern shows consistent positive trends. Consider investing surplus funds for better returns.',
        confidence: 0.78,
        action: 'View Cash Flow',
        category: 'cashflow'
      },
      {
        id: '4',
        type: 'positive',
        title: 'Budget Efficiency',
        description: 'You are operating 12% under budget this month across all categories. Great financial discipline!',
        confidence: 0.88,
        action: 'View Budget Report',
        category: 'budget'
      },
      {
        id: '5',
        type: 'warning',
        title: 'Seasonal Spending Pattern',
        description: 'Travel expenses are 40% higher than usual for this time of year. Monitor for potential budget overruns.',
        confidence: 0.75,
        action: 'Review Travel Budget',
        category: 'travel'
      }
    ];

    // Return random insight for demo
    const randomInsight = mockInsights[Math.floor(Math.random() * mockInsights.length)];

    return NextResponse.json(randomInsight);
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
