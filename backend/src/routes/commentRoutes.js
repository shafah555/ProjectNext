const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { listComments, addComment, deleteComment } = require("../controllers/commentController");

const router = express.Router();

router.use(requireAuth);

router.get("/:taskId/comments", listComments);
router.post("/:taskId/comments", addComment);
router.delete("/:taskId/comments/:commentId", deleteComment);

module.exports = router;
