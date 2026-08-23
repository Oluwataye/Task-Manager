import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { computeDueStatus } from './tasks.js';

const router = Router();

router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { fromDate, toDate, assigneeId, status, priority } = req.query;
    const user = req.user!;

    const where: any = { companyId: user.companyId };

    if (status && status !== 'ALL' && status !== 'All Status') where.status = String(status);
    if (priority && priority !== 'ALL' && priority !== 'All Priority') where.priority = String(priority);

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(String(fromDate));
      if (toDate) where.createdAt.lte = new Date(String(toDate));
    }

    if (assigneeId && assigneeId !== 'ALL') {
      where.assignees = {
        some: { userId: String(assigneeId) },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignees: { include: { user: true } },
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const processedTasks = tasks.map((task) => ({
      ...task,
      dueStatus: computeDueStatus(task),
    }));

    const totalTasks = processedTasks.length;
    const completedTasks = processedTasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgressTasks = processedTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const onHoldTasks = processedTasks.filter((t) => t.status === 'ON_HOLD').length;
    const notStartedTasks = processedTasks.filter((t) => t.status === 'NOT_STARTED').length;
    const cancelledTasks = processedTasks.filter((t) => t.status === 'CANCELLED').length;
    const overdueTasks = processedTasks.filter((t) => t.dueStatus === 'Overdue').length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Team Performance breakdown
    const users = await prisma.user.findMany({
      where: { companyId: user.companyId, status: 'ACTIVE' },
    });

    const teamPerformance = users.map((u) => {
      const userTasks = processedTasks.filter((t) =>
        t.assignees.some((a) => a.userId === u.id)
      );
      const userTotal = userTasks.length;
      const userCompleted = userTasks.filter((t) => t.status === 'COMPLETED').length;
      const userInProgress = userTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const userOverdue = userTasks.filter((t) => t.dueStatus === 'Overdue').length;
      const rate = userTotal > 0 ? Math.round((userCompleted / userTotal) * 100) : 0;

      return {
        user: {
          id: u.id,
          fullName: u.fullName,
          role: u.role,
          photoUrl: u.photoUrl,
        },
        totalTasks: userTotal,
        completed: userCompleted,
        inProgress: userInProgress,
        overdue: userOverdue,
        completionRate: rate,
      };
    });

    return res.json({
      summary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        onHoldTasks,
        notStartedTasks,
        cancelledTasks,
        overdueTasks,
        completionRate,
      },
      teamPerformance,
      tasks: processedTasks,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// CSV Export route
router.get('/export-csv', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { fromDate, toDate, status, priority } = req.query;
    const user = req.user!;

    const where: any = { companyId: user.companyId };
    if (status && status !== 'ALL') where.status = String(status);
    if (priority && priority !== 'ALL') where.priority = String(priority);
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(String(fromDate));
      if (toDate) where.createdAt.lte = new Date(String(toDate));
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignees: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let csvContent = 'Task Name,Priority,Status,Due Status,Due Date,Assignees,Date Created\n';

    tasks.forEach((task) => {
      const dueStatus = computeDueStatus(task);
      const assigneeNames = task.assignees.map((a) => a.user.fullName).join('; ') || 'Unassigned';
      const dueDateStr = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : 'N/A';
      const createdStr = new Date(task.createdAt).toISOString().split('T')[0];

      // Escape quotes
      const cleanName = `"${task.name.replace(/"/g, '""')}"`;
      const cleanAssignees = `"${assigneeNames.replace(/"/g, '""')}"`;

      csvContent += `${cleanName},${task.priority},${task.status},${dueStatus},${dueDateStr},${cleanAssignees},${createdStr}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="task-report.csv"');
    return res.send(csvContent);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
