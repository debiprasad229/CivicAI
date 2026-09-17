import Complaint, { COMPLAINT_CATEGORIES, COMPLAINT_SEVERITIES } from '../models/Complaint.js';

/**
 * GET /api/admin/analytics/overview
 * Overview metrics:
 * - total
 * - submitted
 * - under review
 * - in progress
 * - resolved
 * - high/critical
 * - by category
 * - by severity
 * - top areas
 */
export const getOverview = async (req, res) => {
  try {
    const [totalCount, statusAgg, severityAgg, categoryAgg, topAreasAgg] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Complaint.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ]),
      Complaint.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]),
      Complaint.aggregate([
        {
          $match: {
            address: { $exists: true, $ne: '' }
          }
        },
        {
          $group: {
            _id: '$address',
            count: { $sum: 1 },
            criticalCount: {
              $sum: {
                $cond: [{ $in: ['$severity', ['HIGH', 'CRITICAL']] }, 1, 0]
              }
            },
            resolvedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            area: '$_id',
            count: 1,
            criticalCount: 1,
            resolvedCount: 1
          }
        }
      ])
    ]);

    // Map status breakdown
    const statusMap = {
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REJECTED: 0
    };
    statusAgg.forEach(item => {
      if (item._id && statusMap.hasOwnProperty(item._id)) {
        statusMap[item._id] = item.count;
      }
    });

    const submitted = statusMap.SUBMITTED;
    const underReview = statusMap.UNDER_REVIEW;
    const inProgress = statusMap.IN_PROGRESS;
    const resolved = statusMap.RESOLVED;
    const rejected = statusMap.REJECTED;
    const pending = submitted + underReview;

    // Map severity breakdown
    const severityMap = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };
    severityAgg.forEach(item => {
      if (item._id && severityMap.hasOwnProperty(item._id)) {
        severityMap[item._id] = item.count;
      }
    });

    const highCritical = severityMap.HIGH + severityMap.CRITICAL;

    // High / critical unresolved count
    const highCriticalUnresolved = await Complaint.countDocuments({
      severity: { $in: ['HIGH', 'CRITICAL'] },
      status: { $ne: 'RESOLVED' }
    });

    // Map category breakdown
    const categoryMap = {};
    COMPLAINT_CATEGORIES.forEach(cat => {
      categoryMap[cat] = 0;
    });
    categoryAgg.forEach(item => {
      if (item._id) {
        categoryMap[item._id] = item.count;
      }
    });

    const resolutionRate = totalCount > 0 
      ? Math.round((resolved / totalCount) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        submitted,
        underReview,
        inProgress,
        resolved,
        rejected,
        pending,
        highCritical,
        highCriticalUnresolved,
        resolutionRate,
        byStatus: statusMap,
        bySeverity: severityMap,
        byCategory: categoryMap,
        topAreas: topAreasAgg
      }
    });
  } catch (error) {
    console.error('Failed to generate admin analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics overview',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/analytics/categories
 * Distribution & status metrics by category
 */
export const getCategories = async (req, res) => {
  try {
    const totalCount = await Complaint.countDocuments();
    const categoryStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $in: ['$status', ['SUBMITTED', 'UNDER_REVIEW']] }, 1, 0] }
          },
          critical: {
            $sum: { $cond: [{ $in: ['$severity', ['HIGH', 'CRITICAL']] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const statsMap = new Map();
    categoryStats.forEach(item => {
      statsMap.set(item._id, item);
    });

    const categories = COMPLAINT_CATEGORIES.map(cat => {
      const stat = statsMap.get(cat) || { count: 0, resolved: 0, inProgress: 0, pending: 0, critical: 0 };
      const percentage = totalCount > 0 ? Math.round((stat.count / totalCount) * 1000) / 10 : 0;
      return {
        category: cat,
        count: stat.count,
        percentage,
        resolved: stat.resolved,
        inProgress: stat.inProgress,
        pending: stat.pending,
        critical: stat.critical
      };
    }).sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        categories
      }
    });
  } catch (error) {
    console.error('Failed to generate category analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category analytics',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/analytics/severity
 * Breakdown by severity: LOW, MEDIUM, HIGH, CRITICAL
 */
export const getSeverity = async (req, res) => {
  try {
    const totalCount = await Complaint.countDocuments();
    const severityStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          },
          unresolved: {
            $sum: { $cond: [{ $ne: ['$status', 'RESOLVED'] }, 1, 0] }
          }
        }
      }
    ]);

    const statsMap = new Map();
    severityStats.forEach(item => {
      statsMap.set(item._id, item);
    });

    const severities = COMPLAINT_SEVERITIES.map(sev => {
      const stat = statsMap.get(sev) || { count: 0, resolved: 0, unresolved: 0 };
      const percentage = totalCount > 0 ? Math.round((stat.count / totalCount) * 1000) / 10 : 0;
      return {
        severity: sev,
        count: stat.count,
        percentage,
        resolved: stat.resolved,
        unresolved: stat.unresolved
      };
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        severities
      }
    });
  } catch (error) {
    console.error('Failed to generate severity analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve severity analytics',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/analytics/trends
 * Incident timeline over time (default: last 30 days)
 */
export const getTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const trendsAgg = await Complaint.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] }
          },
          critical: {
            $sum: { $cond: [{ $in: ['$severity', ['HIGH', 'CRITICAL']] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build complete daily timeline map so days with 0 complaints still render cleanly
    const timelineMap = new Map();
    trendsAgg.forEach(item => {
      timelineMap.set(item._id, item);
    });

    const filledTrends = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const existing = timelineMap.get(dateStr);
      if (existing) {
        filledTrends.push({
          date: dateStr,
          total: existing.total,
          resolved: existing.resolved,
          critical: existing.critical,
          inProgress: existing.inProgress
        });
      } else {
        filledTrends.push({
          date: dateStr,
          total: 0,
          resolved: 0,
          critical: 0,
          inProgress: 0
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        days,
        startDate: startDate.toISOString().split('T')[0],
        trends: filledTrends
      }
    });
  } catch (error) {
    console.error('Failed to generate trend analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trend analytics',
      error: error.message
    });
  }
};
