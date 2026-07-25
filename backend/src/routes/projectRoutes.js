const express = require("express");
const { requireAuth, requireProjectMember } = require("../middleware/auth");
const {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require("../controllers/projectController");
const { createTask, updateTask, deleteTask } = require("../controllers/taskController");

const router = express.Router();

router.use(requireAuth);

router.get("/", listProjects);
router.post("/", createProject);

router.get("/:id", requireProjectMember, getProject);
router.patch("/:id", requireProjectMember, updateProject);
router.delete("/:id", requireProjectMember, deleteProject);

router.post("/:id/members", requireProjectMember, addMember);
router.delete("/:id/members/:userId", requireProjectMember, removeMember);

// Tasks nested under a project
router.post("/:projectId/tasks", requireProjectMember, createTask);
router.patch("/:projectId/tasks/:taskId", requireProjectMember, updateTask);
router.delete("/:projectId/tasks/:taskId", requireProjectMember, deleteTask);

module.exports = router;
