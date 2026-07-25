const pool = require("../config/db");

async function getTaskWithJoins(taskId) {
  const { rows } = await pool.query(
    `select t.*, u.name as assignee_name, u.avatar_color as assignee_color
       from tasks t
       left join users u on u.id = t.assignee_id
      where t.id = $1`,
    [taskId]
  );
  return rows[0];
}

// POST /api/projects/:projectId/tasks
async function createTask(req, res, next) {
  try {
    const { title, description, status, priority, assigneeId, dueDate } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required." });
    }

    const posRes = await pool.query(
      "select coalesce(max(position), -1) + 1 as next from tasks where project_id = $1 and status = $2",
      [req.params.projectId, status || "todo"]
    );

    const { rows } = await pool.query(
      `insert into tasks (project_id, title, description, status, priority, assignee_id, due_date, created_by, position)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
      [
        req.params.projectId,
        title.trim(),
        description || "",
        status || "todo",
        priority || "medium",
        assigneeId || null,
        dueDate || null,
        req.user.id,
        posRes.rows[0].next,
      ]
    );

    const task = await getTaskWithJoins(rows[0].id);

    if (assigneeId && assigneeId !== req.user.id) {
      await pool.query(
        `insert into notifications (user_id, type, content, project_id, task_id)
         values ($1, 'task_assigned', $2, $3, $4)`,
        [assigneeId, `${req.user.name} assigned you to "${task.title}"`, req.params.projectId, task.id]
      );
    }

    const io = req.app.get("io");
    io.to(`project:${req.params.projectId}`).emit("task:created", task);
    if (assigneeId) {
      io.to(`user:${assigneeId}`).emit("notification:new", {
        type: "task_assigned",
        content: `${req.user.name} assigned you to "${task.title}"`,
      });
    }

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/projects/:projectId/tasks/:taskId
async function updateTask(req, res, next) {
  try {
    const { title, description, status, priority, assigneeId, dueDate, position } = req.body;

    const before = await getTaskWithJoins(req.params.taskId);
    if (!before) return res.status(404).json({ message: "Task not found." });

    const { rows } = await pool.query(
      `update tasks set
         title = coalesce($1, title),
         description = coalesce($2, description),
         status = coalesce($3, status),
         priority = coalesce($4, priority),
         assignee_id = case when $5::boolean then $6::uuid else assignee_id end,
         due_date = case when $7::boolean then $8::date else due_date end,
         position = coalesce($9, position)
       where id = $10
       returning id`,
      [
        title,
        description,
        status,
        priority,
        Object.prototype.hasOwnProperty.call(req.body, "assigneeId"),
        assigneeId || null,
        Object.prototype.hasOwnProperty.call(req.body, "dueDate"),
        dueDate || null,
        position,
        req.params.taskId,
      ]
    );

    const task = await getTaskWithJoins(rows[0].id);

    // Notify newly assigned user
    if (assigneeId && assigneeId !== before.assignee_id && assigneeId !== req.user.id) {
      await pool.query(
        `insert into notifications (user_id, type, content, project_id, task_id)
         values ($1, 'task_assigned', $2, $3, $4)`,
        [assigneeId, `${req.user.name} assigned you to "${task.title}"`, req.params.projectId, task.id]
      );
    }

    const io = req.app.get("io");
    io.to(`project:${req.params.projectId}`).emit("task:updated", task);
    if (assigneeId && assigneeId !== before.assignee_id && assigneeId !== req.user.id) {
      io.to(`user:${assigneeId}`).emit("notification:new", {
        type: "task_assigned",
        content: `${req.user.name} assigned you to "${task.title}"`,
      });
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/projects/:projectId/tasks/:taskId
async function deleteTask(req, res, next) {
  try {
    await pool.query("delete from tasks where id = $1", [req.params.taskId]);
    const io = req.app.get("io");
    io.to(`project:${req.params.projectId}`).emit("task:deleted", { id: req.params.taskId });
    res.json({ message: "Task deleted." });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTask, updateTask, deleteTask };
