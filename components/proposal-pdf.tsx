import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Scope } from '@/lib/schema';
import { footer, proposalSections } from '@/lib/proposal';
const styles = StyleSheet.create({
  page: { padding: 26, color: '#20212c', fontFamily: 'Helvetica' },
  brand: { fontSize: 9, color: '#5146df', marginBottom: 9 },
  title: { fontSize: 19, fontFamily: 'Times-Roman', marginBottom: 5 },
  meta: { fontSize: 8, color: '#555563', marginBottom: 8 },
  summary: { marginBottom: 10, lineHeight: 1.35 },
  section: { marginBottom: 5 },
  heading: {
    fontSize: 8,
    color: '#5146df',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  line: { lineHeight: 1.2, marginBottom: 2 },
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: '#d8d8df',
    paddingTop: 7,
    marginTop: 7,
    fontSize: 7,
    color: '#555563',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
export function ProposalPDF({ scope }: { scope: Scope }) {
  const sections = proposalSections(scope);
  const length = sections.reduce(
    (n, s) => n + s.lines.join('').length,
    scope.summary.length,
  );
  const fontSize = length > 6000 ? 7 : length > 4500 ? 7.4 : 8;
  return (
    <Document title={scope.title} author="Steve Grady" subject={footer}>
      <Page size="A4" style={{ ...styles.page, fontSize }}>
        <Text style={styles.brand}>ScopeForge / ENGAGEMENT PROPOSAL</Text>
        <Text style={styles.title}>{scope.title}</Text>
        <Text style={styles.meta}>
          Prepared for {scope.customer} · {scope.sector}
        </Text>
        <Text style={{ ...styles.summary, fontSize }}>{scope.summary}</Text>
        {sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text style={styles.heading} minPresenceAhead={20}>
              {s.heading}
            </Text>
            {s.lines.map((line, i) => (
              <Text key={i} style={{ ...styles.line, fontSize }}>
                • {line}
              </Text>
            ))}
          </View>
        ))}
        <View style={styles.footer}>
          <Text>Prepared by Steve Grady</Text>
          <Text>{footer}</Text>
        </View>
      </Page>
    </Document>
  );
}
