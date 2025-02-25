const express = require("express");
const {
  getUpcomingClasses,
  rescheduleClass,
  cancelClass,
  archiveClass,
  unarchiveClass,
  addNotes,
} = require("../controller/classController");

const router = express.Router();

router.get("/upcoming", getUpcomingClasses);
router.post("/reschedule", rescheduleClass);
router.post("/cancel", cancelClass);
router.post("/archive", archiveClass);
router.post("/unarchive", unarchiveClass);
router.post("/add-notes", addNotes);

module.exports = router;
