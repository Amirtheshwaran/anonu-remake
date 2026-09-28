import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AnonUTheme } from '../src/constants/theme';
import { useAuthStore } from '../src/stores/useAuthStore';
import { postService } from '../src/services/postService';
import { IncidentReport, ModeratorAuditLogEntry, UserAppeal } from '../src/types/user';
import { PostModel } from '../src/types/post';
import { BrutalistCard } from '../src/components/BrutalistCard';
import { BrutalistButton } from '../src/components/BrutalistButton';
import { BrutalistDialog } from '../src/components/BrutalistDialog';

export default function AdminScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<'queue' | 'audit' | 'appeals'>('queue');
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<ModeratorAuditLogEntry[]>([]);
  const [appeals, setAppeals] = useState<UserAppeal[]>([]);

  // Selected item for action
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [actionType, setActionType] = useState<'hide' | 'restore' | 'dismiss' | 'strike' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [threadContextPost, setThreadContextPost] = useState<PostModel | null>(null);

  const isModerator = Boolean(user?.isModerator);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsData, logsData, appealsData] = await Promise.all([
        postService.getReports(),
        postService.getModeratorAuditLogs(),
        postService.getAppeals(),
      ]);
      setReports(reportsData as IncidentReport[]);
      setAuditLogs(logsData as ModeratorAuditLogEntry[]);
      setAppeals(appealsData as UserAppeal[]);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModerator) {
      fetchData();
    }
  }, [isModerator]);

  const handleExecuteAction = async () => {
    if (!selectedReport || !actionType) return;

    try {
      await postService.resolveReport({
        reportId: selectedReport.id,
        action: actionType,
        postId: selectedReport.postId || undefined,
        reason: actionReason.trim() || undefined,
      });

      // Refresh data
      await fetchData();
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Could not execute moderation action.');
    } finally {
      setSelectedReport(null);
      setActionType(null);
      setActionReason('');
    }
  };

  const handleViewThreadContext = async (postId?: string | null) => {
    if (!postId) return;
    try {
      const post = await postService.getPost(postId);
      setThreadContextPost(post);
    } catch (err) {
      console.error('Failed to load post context:', err);
    }
  };

  if (!isModerator) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.deniedContainer}>
          <BrutalistCard backgroundColor={AnonUTheme.downvoteRed} padding={24} style={styles.deniedCard}>
            <Text style={styles.deniedIcon}>🔒</Text>
            <Text style={styles.deniedTitle}>ACCESS RESTRICTED</Text>
            <Text style={styles.deniedSub}>
              This console is strictly reserved for verified university moderators with valid authorization claims.
            </Text>
            <View style={{ height: 16 }} />
            <BrutalistButton
              text="← RETURN TO FEED"
              backgroundColor={AnonUTheme.white}
              onPress={() => router.replace('/(tabs)')}
            />
          </BrutalistCard>
        </View>
      </SafeAreaView>
    );
  }

  // Sort queue by severity: crisis first, then high, medium, low
  const severityRank = { crisis: 0, high: 1, medium: 2, low: 3 };
  const sortedReports = [...reports].sort((a, b) => {
    const rankA = severityRank[a.severity || 'low'] ?? 3;
    const rankB = severityRank[b.severity || 'low'] ?? 3;
    return rankA - rankB;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
            <View style={styles.modBadge}>
              <Text style={styles.modBadgeText}>MODERATOR CONSOLE</Text>
            </View>
          </View>
          <Pressable onPress={fetchData} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>⟳ REFRESH</Text>
          </Pressable>
        </View>

        {/* Dashboard Tabs */}
        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab('queue')}
            style={[styles.tabBtn, activeTab === 'queue' && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, activeTab === 'queue' && styles.tabLabelActive]}>
              QUEUE ({reports.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('audit')}
            style={[styles.tabBtn, activeTab === 'audit' && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, activeTab === 'audit' && styles.tabLabelActive]}>
              AUDIT LOG ({auditLogs.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('appeals')}
            style={[styles.tabBtn, activeTab === 'appeals' && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, activeTab === 'appeals' && styles.tabLabelActive]}>
              APPEALS ({appeals.length})
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={AnonUTheme.black} />
          </View>
        ) : (
          <>
            {/* Tab 1: Moderation Queue */}
            {activeTab === 'queue' && (
              <View style={styles.sectionContainer}>
                {sortedReports.length === 0 ? (
                  <BrutalistCard padding={24} style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>🎉</Text>
                    <Text style={styles.emptyTitle}>QUEUE IS ALL CLEAR</Text>
                    <Text style={styles.emptySub}>No pending incident reports or flagged publications.</Text>
                  </BrutalistCard>
                ) : (
                  sortedReports.map((report) => {
                    const isCrisis = report.severity === 'crisis';
                    const isHigh = report.severity === 'high';

                    return (
                      <BrutalistCard
                        key={report.id}
                        padding={16}
                        style={styles.reportCard}
                        backgroundColor={isCrisis ? '#FFF0F0' : AnonUTheme.bgSurface}
                      >
                        <View style={styles.reportHeader}>
                          <View style={styles.severityBadge}>
                            <Text
                              style={[
                                styles.severityText,
                                isCrisis && { color: AnonUTheme.downvoteRed },
                                isHigh && { color: AnonUTheme.popOrange },
                              ]}
                            >
                              {`${(report.severity || 'MEDIUM').toUpperCase()} SEVERITY`}
                            </Text>
                          </View>
                          <Text style={styles.campusTag}>
                            {report.campusId ? report.campusId.toUpperCase() : 'CAMPUS'}
                          </Text>
                        </View>

                        <Text style={styles.reasonText}>
                          REASON: <Text style={styles.reasonHighlight}>{report.reason}</Text>
                        </Text>

                        {report.postId && (
                          <View style={styles.contextBox}>
                            <Text style={styles.contextLabel}>TARGET POST ID: {report.postId}</Text>
                            <Pressable
                              onPress={() => handleViewThreadContext(report.postId)}
                              style={styles.viewThreadBtn}
                            >
                              <Text style={styles.viewThreadText}>🔍 VIEW THREAD CONTEXT</Text>
                            </Pressable>
                          </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.actionGrid}>
                          <Pressable
                            onPress={() => {
                              setSelectedReport(report);
                              setActionType('dismiss');
                            }}
                            style={[styles.modActionBtn, { backgroundColor: AnonUTheme.bgCream }]}
                          >
                            <Text style={styles.modActionText}>DISMISS</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              setSelectedReport(report);
                              setActionType('hide');
                            }}
                            style={[styles.modActionBtn, { backgroundColor: AnonUTheme.popYellow }]}
                          >
                            <Text style={styles.modActionText}>HIDE POST</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              setSelectedReport(report);
                              setActionType('restore');
                            }}
                            style={[styles.modActionBtn, { backgroundColor: AnonUTheme.popMint }]}
                          >
                            <Text style={styles.modActionText}>RESTORE</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              setSelectedReport(report);
                              setActionType('strike');
                            }}
                            style={[styles.modActionBtn, { backgroundColor: AnonUTheme.black }]}
                          >
                            <Text style={[styles.modActionText, { color: AnonUTheme.popYellow }]}>
                              ⚡ ISSUE STRIKE
                            </Text>
                          </Pressable>
                        </View>
                      </BrutalistCard>
                    );
                  })
                )}
              </View>
            )}

            {/* Tab 2: Audit Log */}
            {activeTab === 'audit' && (
              <View style={styles.sectionContainer}>
                {auditLogs.length === 0 ? (
                  <BrutalistCard padding={24} style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>NO AUDIT LOGS RECORDED</Text>
                  </BrutalistCard>
                ) : (
                  auditLogs.map((log) => (
                    <BrutalistCard key={log.id} padding={14} style={styles.logCard}>
                      <View style={styles.logHeader}>
                        <Text style={styles.logAction}>ACTION: {log.action.toUpperCase()}</Text>
                        <Text style={styles.logDate}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                        </Text>
                      </View>
                      <Text style={styles.logDetails}>MODERATOR: {log.moderatorUid}</Text>
                      {log.reason && <Text style={styles.logReason}>REASON: "{log.reason}"</Text>}
                    </BrutalistCard>
                  ))
                )}
              </View>
            )}

            {/* Tab 3: Appeals Inbox */}
            {activeTab === 'appeals' && (
              <View style={styles.sectionContainer}>
                {appeals.length === 0 ? (
                  <BrutalistCard padding={24} style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📬</Text>
                    <Text style={styles.emptyTitle}>NO PENDING APPEALS</Text>
                  </BrutalistCard>
                ) : (
                  appeals.map((appeal) => (
                    <BrutalistCard key={appeal.id} padding={16} style={styles.appealCard}>
                      <Text style={styles.appealTitle}>STRIKE APPEAL #{appeal.strikeId.slice(0, 6)}</Text>
                      <Text style={styles.appealText}>"{appeal.explanation}"</Text>
                      <View style={styles.appealActions}>
                        <Pressable style={[styles.appealBtn, { backgroundColor: AnonUTheme.popMint }]}>
                          <Text style={styles.appealBtnText}>ACCEPT & LIFT TIMEOUT</Text>
                        </Pressable>
                        <Pressable style={[styles.appealBtn, { backgroundColor: AnonUTheme.downvoteRed }]}>
                          <Text style={[styles.appealBtnText, { color: AnonUTheme.white }]}>REJECT</Text>
                        </Pressable>
                      </View>
                    </BrutalistCard>
                  ))
                )}
              </View>
            )}
          </>
        )}

        {/* Action Confirmation Modal */}
        {selectedReport && actionType && (
          <BrutalistDialog
            visible={true}
            title={`CONFIRM ${actionType.toUpperCase()}`}
            message={`Are you sure you want to perform "${actionType.toUpperCase()}" on report ${selectedReport.id.slice(0, 6)}?`}
            confirmLabel="EXECUTE ACTION"
            confirmColor={actionType === 'strike' ? AnonUTheme.black : AnonUTheme.popYellow}
            onConfirm={handleExecuteAction}
            onCancel={() => {
              setSelectedReport(null);
              setActionType(null);
            }}
          />
        )}

        {/* Thread Context Modal */}
        {threadContextPost && (
          <BrutalistDialog
            visible={true}
            title="THREAD CONTEXT"
            message={`[POST CONTENT]:\n"${threadContextPost.content}"\n\nAUTHOR: ${threadContextPost.pseudonym}\nSCORE: ${threadContextPost.score} | COMMENTS: ${threadContextPost.commentCount}`}
            confirmLabel="CLOSE"
            onConfirm={() => setThreadContextPost(null)}
            onCancel={() => setThreadContextPost(null)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AnonUTheme.bgCream,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  modBadge: {
    backgroundColor: AnonUTheme.black,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modBadgeText: {
    color: AnonUTheme.popYellow,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  refreshBtn: {
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: AnonUTheme.bgSurface,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: AnonUTheme.radiusSm - 2,
  },
  tabActive: {
    backgroundColor: AnonUTheme.popYellow,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: AnonUTheme.black,
  },
  tabLabelActive: {
    fontWeight: '900',
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  sectionContainer: {
    gap: 12,
  },
  emptyCard: {
    alignItems: 'center',
    width: '100%',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: AnonUTheme.black,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: AnonUTheme.textSecondary,
    textAlign: 'center',
  },
  reportCard: {
    width: '100%',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    backgroundColor: AnonUTheme.black,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  severityText: {
    color: AnonUTheme.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  campusTag: {
    fontSize: 10,
    fontWeight: '900',
    color: AnonUTheme.textSecondary,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '700',
    color: AnonUTheme.black,
    marginBottom: 10,
  },
  reasonHighlight: {
    fontWeight: '900',
    color: AnonUTheme.downvoteRed,
  },
  contextBox: {
    backgroundColor: AnonUTheme.bgCream,
    borderColor: AnonUTheme.black,
    borderWidth: 1.5,
    borderRadius: AnonUTheme.radiusSm,
    padding: 10,
    marginBottom: 12,
  },
  contextLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: AnonUTheme.textSecondary,
    marginBottom: 6,
  },
  viewThreadBtn: {
    alignSelf: 'flex-start',
  },
  viewThreadText: {
    fontSize: 11,
    fontWeight: '900',
    color: AnonUTheme.black,
    textDecorationLine: 'underline',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modActionBtn: {
    flex: 1,
    minWidth: '45%',
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modActionText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: AnonUTheme.black,
    letterSpacing: 0.5,
  },
  logCard: {
    width: '100%',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logAction: {
    fontSize: 11.5,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  logDate: {
    fontSize: 10,
    color: AnonUTheme.textSecondary,
  },
  logDetails: {
    fontSize: 11,
    color: AnonUTheme.textSecondary,
    marginBottom: 2,
  },
  logReason: {
    fontSize: 11,
    fontWeight: '700',
    color: AnonUTheme.black,
  },
  appealCard: {
    width: '100%',
  },
  appealTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: AnonUTheme.black,
    marginBottom: 6,
  },
  appealText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: AnonUTheme.textBlack,
    marginBottom: 12,
  },
  appealActions: {
    flexDirection: 'row',
    gap: 8,
  },
  appealBtn: {
    flex: 1,
    borderColor: AnonUTheme.black,
    borderWidth: AnonUTheme.borderWidthThin,
    borderRadius: AnonUTheme.radiusSm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  appealBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: AnonUTheme.black,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  deniedCard: {
    alignItems: 'center',
    width: '100%',
  },
  deniedIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: AnonUTheme.white,
    marginBottom: 6,
  },
  deniedSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: AnonUTheme.white,
    textAlign: 'center',
    lineHeight: 18,
  },
});
