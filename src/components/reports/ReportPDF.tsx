'use client';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#111827' },
  header: { backgroundColor: '#0f172a', padding: 30, borderRadius: 8, marginBottom: 20 },
  headerBrand: { fontSize: 8, color: '#a78bfa', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 4 },
  headerSub: { fontSize: 10, color: '#94a3b8' },
  headerMeta: { flexDirection: 'row', gap: 20, marginTop: 16 },
  metaItem: {},
  metaLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metaVal: { fontSize: 9, color: '#e2e8f0', fontWeight: 700 },
  sectionTitle: { fontSize: 10, fontWeight: 700, color: '#FF0066', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiBox: { flex: 1, backgroundColor: '#f8fafc', border: '1 solid #e2e8f0', borderRadius: 6, padding: 12 },
  kpiVal: { fontSize: 18, fontWeight: 700, color: '#111827' },
  kpiLabel: { fontSize: 8, color: '#6b7280', marginTop: 2 },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  th: { fontSize: 7, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.3 },
  td: { fontSize: 9, color: '#374151' },
  tdBold: { fontSize: 9, color: '#111827', fontWeight: 700 },
  insightCard: { backgroundColor: '#faf5ff', border: '1 solid #ddd6fe', borderRadius: 6, padding: 10, marginBottom: 6 },
  insightType: { fontSize: 7, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  insightTitle: { fontSize: 10, fontWeight: 700, color: '#111827', marginBottom: 3 },
  insightDesc: { fontSize: 8, color: '#6b7280', lineHeight: 1.4 },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
  footerText: { fontSize: 7, color: '#9ca3af' },
  footerBrand: { fontSize: 7, color: '#7c3aed', fontWeight: 700 },
});

interface ReportData {
  workspace: { name: string; logo_url?: string; brand_color?: string };
  sections: {
    ga4?: {
      totalSessions: number;
      totalUsers: number;
      dailyData: { date: string; sessions: number }[];
      sources: { source: string; sessions: number }[];
      pages: { page: string; pageviews: number }[];
    };
    gsc?: {
      keywords: { query: string; clicks: number; impressions: number; position: number; ctr: number }[];
      totalKeywords: number;
    };
    insights?: { title: string; description: string; type: string; priority: number }[];
  };
  selectedSections: string[];
  dateRange: string;
}

export function ReportPDF({ data }: { data: ReportData }) {
  const name = data.workspace?.name || 'Marketing Report';
  const brandColor = data.workspace?.brand_color || '#7c3aed';
  const generated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const ga4 = data.sections.ga4;
  const gsc = data.sections.gsc;
  const insights = data.sections.insights;
  const selected = data.selectedSections || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header — uses workspace branding */}
        <View style={styles.header}>
          <Text style={{ ...styles.headerBrand, color: brandColor }}>{name} · Marketing Report</Text>
          <Text style={styles.headerTitle}>Marketing Performance Report</Text>
          <Text style={styles.headerSub}>{name}</Text>
          <View style={styles.headerMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Period</Text>
              <Text style={styles.metaVal}>{data.dateRange}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Generated</Text>
              <Text style={styles.metaVal}>{generated}</Text>
            </View>
          </View>
        </View>

        {/* Overview / GA4 Section */}
        {selected.includes('overview') && ga4 && (
          <View>
            <Text style={styles.sectionTitle}>Traffic Overview</Text>
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{ga4.totalSessions.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Sessions</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{ga4.totalUsers.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Users</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{ga4.totalSessions > 0 ? Math.round(ga4.totalSessions / Math.max(ga4.dailyData.length, 1)).toLocaleString() : '0'}</Text>
                <Text style={styles.kpiLabel}>Avg Daily Sessions</Text>
              </View>
            </View>
          </View>
        )}

        {/* GA4 Traffic Sources */}
        {selected.includes('ga4') && ga4 && ga4.sources.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Traffic Sources</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: '50%' }]}>Source</Text>
                <Text style={[styles.th, { width: '25%' }]}>Sessions</Text>
                <Text style={[styles.th, { width: '25%' }]}>Share</Text>
              </View>
              {ga4.sources.sort((a, b) => b.sessions - a.sessions).slice(0, 10).map((s, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tdBold, { width: '50%' }]}>{s.source || 'direct'}</Text>
                  <Text style={[styles.td, { width: '25%' }]}>{s.sessions.toLocaleString()}</Text>
                  <Text style={[styles.td, { width: '25%' }]}>{ga4.totalSessions > 0 ? ((s.sessions / ga4.totalSessions) * 100).toFixed(1) : '0'}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* GSC Keywords */}
        {selected.includes('gsc') && gsc && gsc.keywords.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>GSC Keywords ({gsc.totalKeywords} tracked)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: '5%' }]}>#</Text>
                <Text style={[styles.th, { width: '35%' }]}>Keyword</Text>
                <Text style={[styles.th, { width: '15%' }]}>Position</Text>
                <Text style={[styles.th, { width: '15%' }]}>Clicks</Text>
                <Text style={[styles.th, { width: '15%' }]}>Impressions</Text>
                <Text style={[styles.th, { width: '15%' }]}>CTR</Text>
              </View>
              {gsc.keywords.slice(0, 20).map((k, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.td, { width: '5%', color: '#9ca3af' }]}>{i + 1}</Text>
                  <Text style={[styles.tdBold, { width: '35%' }]}>{k.query}</Text>
                  <Text style={[styles.td, { width: '15%' }]}>#{Math.round(k.position)}</Text>
                  <Text style={[styles.tdBold, { width: '15%' }]}>{k.clicks}</Text>
                  <Text style={[styles.td, { width: '15%' }]}>{k.impressions.toLocaleString()}</Text>
                  <Text style={[styles.td, { width: '15%' }]}>{k.ctr.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* AI Insights */}
        {selected.includes('insights') && insights && insights.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            {insights.slice(0, 5).map((insight, i) => (
              <View key={i} style={styles.insightCard}>
                <Text style={styles.insightType}>{insight.type}</Text>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDesc}>{insight.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={{ ...styles.footerBrand, color: brandColor }}>{name}</Text>
          <Text style={styles.footerText}>Generated by Lumnix · {generated}</Text>
        </View>
      </Page>
    </Document>
  );
}
