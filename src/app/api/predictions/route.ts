import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { callClaude } from '@/lib/anthropic';

/**
 * Simple linear regression for forecasting
 */
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

function forecast(
  historicalValues: number[],
  forecastDays: number
): Array<{ index: number; predicted: number; lower: number; upper: number }> {
  const { slope, intercept } = linearRegression(historicalValues);
  const n = historicalValues.length;

  // Calculate residual standard deviation for confidence interval
  const residuals = historicalValues.map((v, i) => v - (intercept + slope * i));
  const residStd = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(n - 2, 1));

  const results: Array<{ index: number; predicted: number; lower: number; upper: number }> = [];
  for (let i = 0; i < forecastDays; i++) {
    const x = n + i;
    const predicted = Math.max(0, Math.round(intercept + slope * x));
    const margin = Math.round(1.96 * residStd * Math.sqrt(1 + 1 / n + ((x - (n - 1) / 2) ** 2) / (n * ((n * n - 1) / 12))));
    results.push({
      index: x,
      predicted,
      lower: Math.max(0, predicted - margin),
      upper: predicted + margin,
    });
  }
  return results;
}

// GET /api/predictions?workspace_id=xxx&metric=sessions&days=30
export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });

  const metric = req.nextUrl.searchParams.get('metric') || 'sessions';
  const forecastDays = parseInt(req.nextUrl.searchParams.get('days') || '14');
  const db = getSupabaseAdmin();

  // Check for cached predictions less than 24h old
  const { data: cached } = await db
    .from('predictions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('metric', metric)
    .gte('generated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  // Gather historical data (last 60 days, daily aggregated)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  let dailyValues: Record<string, number> = {};

  if (metric === 'sessions' || metric === 'users') {
    const metricType = metric === 'sessions' ? 'sessions' : 'totalUsers';
    const { data } = await db.from('ga4_data')
      .select('date, value')
      .eq('workspace_id', workspaceId)
      .eq('metric_type', metricType)
      .gte('date', sixtyDaysAgo)
      .order('date', { ascending: true });

    for (const row of data || []) {
      dailyValues[row.date] = (dailyValues[row.date] || 0) + (row.value || 0);
    }
  } else if (metric === 'clicks' || metric === 'impressions') {
    const { data } = await db.from('gsc_data')
      .select(`date, ${metric}`)
      .eq('workspace_id', workspaceId)
      .gte('date', sixtyDaysAgo)
      .order('date', { ascending: true });

    for (const row of data || []) {
      dailyValues[row.date] = (dailyValues[row.date] || 0) + ((row as any)[metric] || 0);
    }
  }

  const dates = Object.keys(dailyValues).sort();
  const values = dates.map(d => dailyValues[d]);

  if (values.length < 7) {
    return NextResponse.json({
      metric,
      message: 'Not enough historical data for predictions. Need at least 7 days.',
      historical: dates.map((d, i) => ({ date: d, value: values[i] })),
      forecast: [],
    });
  }

  // Generate forecast
  const forecastData = forecast(values, forecastDays);

  // Generate forecast dates
  const lastDate = new Date(dates[dates.length - 1]);
  const forecastWithDates = forecastData.map((f, i) => {
    const d = new Date(lastDate.getTime() + (i + 1) * 86400000);
    return {
      date: d.toISOString().slice(0, 10),
      predicted: f.predicted,
      lower: f.lower,
      upper: f.upper,
    };
  });

  // AI narrative
  let narrative = '';
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const trend = forecastWithDates.length > 0 ? forecastWithDates[forecastWithDates.length - 1].predicted - values[values.length - 1] : 0;
      const avgRecent = values.slice(-7).reduce((a, b) => a + b, 0) / 7;
      const avgForecast = forecastWithDates.reduce((a, b) => a + b.predicted, 0) / forecastWithDates.length;

      narrative = await callClaude(
        [{ role: 'user', content: `Metric: ${metric}. Last 7 days avg: ${Math.round(avgRecent)}. Forecast avg (next ${forecastDays} days): ${Math.round(avgForecast)}. Trend: ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'} by ${Math.abs(Math.round(trend))}.` }],
        { maxTokens: 150, system: 'You are a marketing analyst. Write a 2-3 sentence forecast summary based on the data. Be specific with numbers. Keep it concise.' },
      );
    } catch {}
  }

  const result = {
    metric,
    historical: dates.map((d, i) => ({ date: d, value: values[i] })),
    forecast: forecastWithDates,
    narrative,
    generated_at: new Date().toISOString(),
  };

  // Cache prediction
  try {
    await db.from('predictions').insert({
      workspace_id: workspaceId,
      metric,
      forecast_data: forecastWithDates,
      narrative,
      generated_at: new Date().toISOString(),
    });
  } catch {}

  return NextResponse.json(result);
}
