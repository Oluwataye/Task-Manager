import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

const router = Router();

export function computeDueStatus(task: any): 'On Time' | 'Due Soon' | 'Overdue' {
  if (!task.dueDate) return 'On Time';

  const due = new Date(task.dueDate);
  const now = new Date();

  if (task.status === 'COMPLETED') {
    const comp = task.completionDate ? new Date(task.completionDate) : new Date(task.updatedAt);
    return comp <= due ? 'On Time' : 'Overdue';
  }

  // Set hours to end of day for fair comparison
  due.setHours(23, 59, 59, 999);
  
  if (now > due) {
    return 'Overdue';
  }

  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 2) {
    return 'Due Soon';
  }

  return 'On Time';
}

// GET all tasks (scoped by user role & filters)
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, priority, filterChip, myTasksOnly, propertyId, projectId, assetId } = req.query;
    const user = req.user!;

    let whereClause: any = {
      companyId: user.companyId,
    };

    // Role-based scoping
    if (user.role === 'STAFF' || myTasksOnly === 'true') {
      whereClause.assignees = {
        some: { userId: user.id },
      };
    } else if (user.role === 'CONTRACTOR_TENANT') {
      whereClause.OR = [
        { assignees: { some: { userId: user.id } } },
        { createdById: user.id },
      ];
    } else if (user.role === 'PROPERTY_MANAGER' && propertyId) {
      whereClause.propertyId = String(propertyId);
    } else if (user.role === 'PROJECT_MANAGER' && projectId) {
      whereClause.projectId = String(projectId);
    } else if (user.role === 'FACILITIES_MANAGER' && assetId) {
      whereClause.assetId = String(assetId);
    }

    // Filter params
    if (status && status !== 'ALL' && status !== 'All Status') {
      whereClause.status = String(status);
    }

    if (priority && priority !== 'ALL' && priority !== 'All Priority') {
      whereClause.priority = String(priority);
    }

    if (search) {
      whereClause.name = {
        contains: String(search),
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                photoUrl: true,
                role: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        property: true,
        project: true,
        asset: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute due status for each task
    const processedTasks = tasks.map((task) => {
      const dueStatus = computeDueStatus(task);
      return {
        ...task,
        dueStatus,
      };
    });

    // Apply Filter Chips if specified: Visible (all non-cancelled/active), In Progress, Completed, Overdue
    let filtered = processedTasks;
    if (filterChip === 'In Progress') {
      filtered = processedTasks.filter((t) => t.status === 'IN_PROGRESS');
    } else if (filterChip === 'Completed') {
      filtered = processedTasks.filter((t) => t.status === 'COMPLETED');
    } else if (filterChip === 'Overdue') {
      filtered = processedTasks.filter((t) => t.dueStatus === 'Overdue');
    } else if (filterChip === 'Visible') {
      filtered = processedTasks.filter((t) => t.status !== 'CANCELLED');
    }

    // Calculate filter chip counts from the total scoped dataset
    const counts = {
      visible: processedTasks.filter((t) => t.status !== 'CANCELLED').length,
      inProgress: processedTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      completed: processedTasks.filter((t) => t.status === 'COMPLETED').length,
      overdue: processedTasks.filter((t) => t.dueStatus === 'Overdue').length,
      total: processedTasks.length,
    };

    return res.json({
      tasks: filtered,
      counts,
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET single task by ID
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignees: {
          include: {
            user: true,
          },
        },
        createdBy: true,
        property: true,
        project: true,
        asset: true,
        invoice: true,
      },
    });

    if (!task) return res.status(404).json({ error: 'Task not found' });

    return res.json({
      task: {
        ...task,
        dueStatus: computeDueStatus(task),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST Create task
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      linkOrFile,
      priority = 'MEDIUM',
      status = 'NOT_STARTED',
      dueDate,
      startDate,
      notes,
      assigneeIds = [],
      propertyId,
      projectId,
      assetId,
      invoiceId,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Task name is required' });
    }

    const user = req.user!;

    // Max 3 assignees check
    const validAssigneeIds = Array.isArray(assigneeIds) ? assigneeIds.slice(0, 3) : [];

    const task = await prisma.task.create({
      data: {
        companyId: user.companyId,
        createdById: user.id,
        name,
        description,
        linkOrFile,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        completionDate: status === 'COMPLETED' ? new Date() : null,
        notes,
        propertyId: propertyId || null,
        projectId: projectId || null,
        assetId: assetId || null,
        invoiceId: invoiceId || null,
        assignees: {
          create: validAssigneeIds.map((id: string) => ({ userId: id })),
        },
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                photoUrl: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: 'Task created successfully',
      task: {
        ...task,
        dueStatus: computeDueStatus(task),
      },
    });
  } catch (error: any) {
    console.error('Task creation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// PATCH Update task (including inline status or full edit)
router.patch('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      linkOrFile,
      priority,
      status,
      dueDate,
      startDate,
      notes,
      assigneeIds,
      propertyId,
      projectId,
      assetId,
      invoiceId,
    } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (linkOrFile !== undefined) updateData.linkOrFile = linkOrFile;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (propertyId !== undefined) updateData.propertyId = propertyId || null;
    if (projectId !== undefined) updateData.projectId = projectId || null;
    if (assetId !== undefined) updateData.assetId = assetId || null;
    if (invoiceId !== undefined) updateData.invoiceId = invoiceId || null;

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
        updateData.completionDate = new Date();
      } else if (status !== 'COMPLETED') {
        updateData.completionDate = null;
      }
    }

    // Handle Assignees update if passed
    if (Array.isArray(assigneeIds)) {
      await prisma.taskAssignee.deleteMany({ where: { taskId: id } });
      const validAssigneeIds = assigneeIds.slice(0, 3);
      await prisma.taskAssignee.createMany({
        data: validAssigneeIds.map((userId: string) => ({ taskId: id, userId })),
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                photoUrl: true,
              },
            },
          },
        },
        property: true,
        project: true,
        asset: true,
        invoice: true,
      },
    });

    return res.json({
      message: 'Task updated successfully',
      task: {
        ...updatedTask,
        dueStatus: computeDueStatus(updatedTask),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE task
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    return res.json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
