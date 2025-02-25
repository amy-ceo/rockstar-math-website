const Class = require("../models/Class");
const { fetchUpcomingBookings } = require("../utils/calendly");
// 📌 Get all upcoming classes
exports.getUpcomingClasses = async (req, res) => {
    try {
      const calendlyClasses = await fetchUpcomingBookings();
      res.json(calendlyClasses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

// 📌 Reschedule class
exports.rescheduleClass = async (req, res) => {
  const { classId, newTime } = req.body;
  try {
    const updatedClass = await Class.findByIdAndUpdate(classId, { timeSlot: newTime }, { new: true });
    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Cancel class
exports.cancelClass = async (req, res) => {
  const { classId } = req.body;
  try {
    await Class.findByIdAndUpdate(classId, { status: "canceled" });
    res.json({ message: "Class canceled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Archive class
exports.archiveClass = async (req, res) => {
  const { classId } = req.body;
  try {
    await Class.findByIdAndUpdate(classId, { status: "archived" });
    res.json({ message: "Class archived successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Unarchive class
exports.unarchiveClass = async (req, res) => {
  const { classId } = req.body;
  try {
    await Class.findByIdAndUpdate(classId, { status: "upcoming" });
    res.json({ message: "Class unarchived successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Add Notes
exports.addNotes = async (req, res) => {
  const { classId, notes } = req.body;
  try {
    const updatedClass = await Class.findByIdAndUpdate(classId, { notes }, { new: true });
    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
