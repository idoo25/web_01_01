import Team from '../models/Team.js';
import GroupReflection from '../models/GroupReflection.js';
import Notification from '../models/Notification.js';

// Check all teams and update status based on sentiment
export async function checkTeamsStatus() {
  console.log('🔍 Running team status check...');
  
  try {
    const teams = await Team.find({});
    let updatedCount = 0;
    let criticalCount = 0;

    for (const team of teams) {
      // Get recent sessions
      const sessions = await GroupReflection.find({ teamId: team.teamId })
        .sort({ createdAt: -1 })
        .limit(5);

      if (sessions.length === 0) continue;

      // Calculate average sentiment
      const sentiments = sessions
        .map(s => s.hfAnalysis?.sentiment_score || 0)
        .filter(s => s !== 0);

      if (sentiments.length === 0) continue;

      const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
      
      // Determine new status
      let newStatus = 'green';
      let notificationType = null;
      let notificationMessage = '';

      if (avgSentiment < -0.3) {
        newStatus = 'red';
        notificationType = 'critical';
        notificationMessage = `⚠️ CRITICAL: Team ${team.teamId} has very low sentiment (${avgSentiment.toFixed(2)}). Immediate intervention recommended.`;
        criticalCount++;
      } else if (avgSentiment < 0) {
        newStatus = 'yellow';
        notificationType = 'warning';
        notificationMessage = `⚡ WARNING: Team ${team.teamId} showing concerning sentiment (${avgSentiment.toFixed(2)}). Monitor closely.`;
      }

      // Update team if status changed
      if (team.status !== newStatus) {
        team.status = newStatus;
        team.averageSentiment = avgSentiment;
        await team.save();
        updatedCount++;

        // Create notification
        if (notificationType) {
          const notification = new Notification({
            teamId: team.teamId,
            instructorId: team.instructorId,
            type: notificationType,
            message: notificationMessage,
            severity: newStatus === 'red' ? 'HIGH' : 'MEDIUM'
          });
          await notification.save();
        }
      }
    }

    console.log(`✅ Team check complete: ${updatedCount} teams updated, ${criticalCount} critical alerts`);
  } catch (error) {
    console.error('❌ Team check error:', error);
  }
}

// Detect stale teams (no activity in 7 days)
export async function checkStaleTeams() {
  console.log('🕐 Checking for stale teams...');
  
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const staleTeams = await Team.find({
      lastActivity: { $lt: sevenDaysAgo }
    });

    for (const team of staleTeams) {
      const notification = new Notification({
        teamId: team.teamId,
        instructorId: team.instructorId,
        type: 'warning',
        message: `📅 Team ${team.teamId} has been inactive for 7+ days. Last activity: ${team.lastActivity.toLocaleDateString()}`,
        severity: 'MEDIUM'
      });
      await notification.save();
    }

    console.log(`✅ Stale check complete: ${staleTeams.length} inactive teams found`);
  } catch (error) {
    console.error('❌ Stale check error:', error);
  }
}

// Weekly summary (run every Friday at 9 AM)
export async function generateWeeklySummary() {
  console.log('📊 Generating weekly summary...');
  
  try {
    // Get all instructors
    const teams = await Team.find({}).populate('instructorId');
    const instructorMap = new Map();

    // Group teams by instructor
    for (const team of teams) {
      const instructorId = team.instructorId._id.toString();
      if (!instructorMap.has(instructorId)) {
        instructorMap.set(instructorId, {
          instructor: team.instructorId,
          teams: []
        });
      }
      instructorMap.get(instructorId).teams.push(team);
    }

    // Generate summary for each instructor
    for (const [instructorId, data] of instructorMap) {
      const { instructor, teams } = data;
      
      const greenCount = teams.filter(t => t.status === 'green').length;
      const yellowCount = teams.filter(t => t.status === 'yellow').length;
      const redCount = teams.filter(t => t.status === 'red').length;

      const message = `
📈 Weekly Team Summary

Total Teams: ${teams.length}
🟢 Green: ${greenCount}
🟡 Yellow: ${yellowCount}
🔴 Red: ${redCount}

${redCount > 0 ? `⚠️ ${redCount} team(s) need immediate attention!` : '✅ All teams doing well!'}

Top Issues:
${redCount > 0 ? '- Low sentiment in red teams' : '- None'}
${yellowCount > 0 ? `- ${yellowCount} teams showing warning signs` : ''}

Recommendations:
${redCount > 0 ? '- Schedule meetings with red teams' : ''}
${yellowCount > 0 ? '- Monitor yellow teams closely' : ''}
- Encourage regular reflections
      `.trim();

      const notification = new Notification({
        teamId: 'WEEKLY_SUMMARY',
        instructorId: instructor._id,
        type: 'info',
        message,
        severity: redCount > 0 ? 'HIGH' : 'LOW'
      });
      await notification.save();
    }

    console.log(`✅ Weekly summary complete for ${instructorMap.size} instructors`);
  } catch (error) {
    console.error('❌ Weekly summary error:', error);
  }
}

// Initialize monitoring (to be called from server.js)
export function initializeMonitoring() {
  console.log('🚀 Monitoring system initialized');
  console.log('  - Team status check: Every hour');
  console.log('  - Stale teams check: Daily at midnight');
  console.log('  - Weekly summary: Fridays at 9 AM');
}
