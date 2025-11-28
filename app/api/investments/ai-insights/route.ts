import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { investments, metrics, existingInsights } = await request.json();
    
    // Generate AI-powered insights
    // TODO: Integrate with OpenAI/Anthropic API for enhanced insights
    // For now, return enhanced rule-based insights
    
    const aiInsights = [];
    
    // AI-generated portfolio analysis
    if (metrics?.diversificationScore < 60) {
      aiInsights.push({
        id: 'ai-diversification',
        type: 'strategy',
        title: 'AI Portfolio Optimization',
        description: `Based on modern portfolio theory, your portfolio could benefit from adding 3-5 additional holdings across different sectors. This could improve your diversification score from ${Math.round(metrics.diversificationScore)} to 75+.`,
        action: 'Get Personalized Recommendations',
        confidence: 0.87,
        priority: 'high',
        impact: 'Risk Reduction & Returns'
      });
    }
    
    // Market timing insights
    if (investments && investments.length > 0) {
      const avgGain = investments.reduce((sum: number, inv: any) => sum + (inv.unrealized_gain_loss_percent || 0), 0) / investments.length;
      if (avgGain > 20) {
        aiInsights.push({
          id: 'ai-profit-taking',
          type: 'strategy',
          title: 'AI Profit-Taking Strategy',
          description: `Your portfolio shows strong gains (avg ${avgGain.toFixed(1)}%). Consider taking partial profits on positions that have exceeded your target returns to lock in gains and reduce risk.`,
          action: 'View Profit-Taking Plan',
          confidence: 0.82,
          priority: 'medium',
          impact: 'Capital Preservation'
        });
      }
    }

    // Sector allocation analysis
    if (investments && investments.length > 0) {
      const sectors: { [key: string]: number } = {};
      const totalValue = investments.reduce((sum: number, inv: any) => sum + (inv.current_value || 0), 0);
      
      // Simplified sector detection (in production, use actual sector data)
      investments.forEach((inv: any) => {
        const symbol = inv.symbol || '';
        let sector = 'Other';
        if (['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA'].includes(symbol)) sector = 'Technology';
        else if (['JPM', 'BAC', 'WFC'].includes(symbol)) sector = 'Financial';
        else if (['JNJ', 'PFE', 'UNH'].includes(symbol)) sector = 'Healthcare';
        
        sectors[sector] = (sectors[sector] || 0) + (inv.current_value || 0);
      });

      const maxSectorPercent = totalValue > 0 
        ? (Math.max(...Object.values(sectors)) / totalValue) * 100 
        : 0;

      if (maxSectorPercent > 60) {
        aiInsights.push({
          id: 'ai-sector-diversification',
          type: 'warning',
          title: 'Sector Concentration Risk',
          description: `Your portfolio is heavily concentrated in one sector (${maxSectorPercent.toFixed(1)}%). Diversifying across multiple sectors can reduce volatility and improve risk-adjusted returns.`,
          action: 'Explore Sector Diversification',
          confidence: 0.85,
          priority: 'high',
          impact: 'Risk Reduction'
        });
      }
    }
    
    return NextResponse.json(aiInsights);
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


