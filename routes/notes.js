const express = require('express');
const router = express.Router();
const db = require('../firebase');
const logger = require('../logger'); // Import the logger
const { parseISO, isValid, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } = require('date-fns');

// Helper function to sanitize input server-side
function sanitizeInput(str) {
  return String(str).replace(/[&<>"'`=\/]/g, function(s) {
    return '&#' + s.charCodeAt(0) + ';';
  });
}

/**
 * GET /notes/day/:date
 * Retrieve all notes for a specific day.
 */
router.get('/day/:date', async (req, res) => {
  const { date } = req.params;
  logger.info(`GET request received for all notes on ${date}`);
  
  // Parse and validate date
  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) {
    logger.warn(`Invalid date format received: ${date}`);
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  try {
    const snapshot = await db.ref(`notes/${date}`).once('value');
    const notes = snapshot.val();

    if (notes) {
      logger.info(`Notes found for ${date}`);
      res.status(200).json(notes);
    } else {
      logger.warn(`No notes found for ${date}`);
      res.status(404).json({ error: 'No notes found for the specified date.' });
    }
  } catch (error) {
    logger.error(`Error fetching notes for ${date}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
});

/**
 * GET /notes/week/:date
 * Retrieve all notes for the week containing the specified date.
 */
router.get('/week/:date', async (req, res) => {
  const { date } = req.params;
  logger.info(`GET request received for all notes in the week of ${date}`);
  
  // Parse and validate date
  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) {
    logger.warn(`Invalid date format received: ${date}`);
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  // Get start and end of the week (Monday to Sunday)
  const weekStartDate = startOfWeek(parsedDate, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(parsedDate, { weekStartsOn: 1 });

  const weekStart = format(weekStartDate, 'yyyy-MM-dd');
  const weekEnd = format(weekEndDate, 'yyyy-MM-dd');

  try {
    const snapshot = await db.ref(`notes`).once('value');
    const allNotes = snapshot.val();

    if (allNotes) {
      // Filter notes within the week range
      const weekNotes = {};
      for (const [noteDate, times] of Object.entries(allNotes)) {
        if (noteDate >= weekStart && noteDate <= weekEnd) {
          weekNotes[noteDate] = times;
        }
      }

      if (Object.keys(weekNotes).length > 0) {
        logger.info(`Notes found for the week of ${weekStart} to ${weekEnd}`);
        res.status(200).json(weekNotes);
      } else {
        logger.warn(`No notes found for the week of ${weekStart} to ${weekEnd}`);
        res.status(404).json({ error: 'No notes found for the specified week.' });
      }
    } else {
      logger.warn(`No notes found in the database.`);
      res.status(404).json({ error: 'No notes found.' });
    }
  } catch (error) {
    logger.error(`Error fetching notes for the week of ${weekStart}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
});

/**
 * GET /notes/month/:date
 * Retrieve all notes for the month containing the specified date.
 */
router.get('/month/:date', async (req, res) => {
  const { date } = req.params;
  logger.info(`GET request received for all notes in the month of ${date}`);
  
  // Parse and validate date
  const parsedDate = parseISO(date);
  if (!isValid(parsedDate)) {
    logger.warn(`Invalid date format received: ${date}`);
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  // Get start and end of the month
  const monthStartDate = startOfMonth(parsedDate);
  const monthEndDate = endOfMonth(parsedDate);

  const monthStart = format(monthStartDate, 'yyyy-MM-dd');
  const monthEnd = format(monthEndDate, 'yyyy-MM-dd');

  try {
    const snapshot = await db.ref(`notes`).once('value');
    const allNotes = snapshot.val();

    if (allNotes) {
      // Filter notes within the month range
      const monthNotes = {};
      for (const [noteDate, times] of Object.entries(allNotes)) {
        if (noteDate >= monthStart && noteDate <= monthEnd) {
          monthNotes[noteDate] = times;
        }
      }

      if (Object.keys(monthNotes).length > 0) {
        logger.info(`Notes found for the month of ${monthStart} to ${monthEnd}`);
        res.status(200).json(monthNotes);
      } else {
        logger.warn(`No notes found for the month of ${monthStart} to ${monthEnd}`);
        res.status(404).json({ error: 'No notes found for the specified month.' });
      }
    } else {
      logger.warn(`No notes found in the database.`);
      res.status(404).json({ error: 'No notes found.' });
    }
  } catch (error) {
    logger.error(`Error fetching notes for the month of ${monthStart}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
});

/**
 * GET /notes/:date/:time
 * Retrieve a specific note.
 */
router.get('/:date/:time', async (req, res) => {
  const { date, time } = req.params;
  logger.info(`GET request received for note on ${date} at ${time}`);
  
  // Validate date and time formats
  const parsedDate = parseISO(date);
  const timePattern = /^\d{2}:\d{2}$/; // HH:MM format
  if (!isValid(parsedDate) || !timePattern.test(time)) {
    logger.warn(`Invalid date or time format received: ${date} ${time}`);
    return res.status(400).json({ error: 'Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time.' });
  }

  try {
    const snapshot = await db.ref(`notes/${date}/${time}`).once('value');
    const note = snapshot.val();
    if (note) {
      logger.info(`Note found for ${date} at ${time}`);
      res.status(200).json(note);
    } else {
      logger.warn(`Note not found for ${date} at ${time}`);
      res.status(404).json({ error: 'Note not found.' });
    }
  } catch (error) {
    logger.error(`Error fetching note for ${date} ${time}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch note.' });
  }
});

/**
 * POST /notes/:date/:time
 * Create a new note.
 */
router.post('/:date/:time', async (req, res) => {
  const { date, time } = req.params;
  let { text } = req.body;
  text = sanitizeInput(text);
  logger.info(`POST request to create/update note on ${date} at ${time}`);

  // Validate input
  const parsedDate = parseISO(date);
  const timePattern = /^\d{2}:\d{2}$/; // HH:MM format
  if (!isValid(parsedDate) || !timePattern.test(time)) {
    logger.warn(`Invalid date or time format received: ${date} ${time}`);
    return res.status(400).json({ error: 'Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time.' });
  }

  if (!text) {
    logger.warn(`POST request missing 'text' for ${date} at ${time}`);
    return res.status(400).json({ error: 'Text is required.' });
  }

  try {
    const noteData = { text, timestamp: Date.now() };
    await db.ref(`notes/${date}/${time}`).set(noteData);
    logger.info(`Note created/updated for ${date} at ${time}`);
    res.status(201).json({ message: 'Note created successfully.' });
  } catch (error) {
    logger.error(`Error creating note for ${date} ${time}: ${error.message}`);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

/**
 * PUT /notes/:date/:time
 * Update an existing note.
 */
router.put('/:date/:time', async (req, res) => {
  const { date, time } = req.params;
  let { text } = req.body;
  text = sanitizeInput(text);
  logger.info(`PUT request to update note on ${date} at ${time}`);

  // Validate input
  const parsedDate = parseISO(date);
  const timePattern = /^\d{2}:\d{2}$/; // HH:MM format
  if (!isValid(parsedDate) || !timePattern.test(time)) {
    logger.warn(`Invalid date or time format received: ${date} ${time}`);
    return res.status(400).json({ error: 'Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time.' });
  }

  if (!text) {
    logger.warn(`PUT request missing 'text' for ${date} at ${time}`);
    return res.status(400).json({ error: 'Text is required.' });
  }

  try {
    const noteRef = db.ref(`notes/${date}/${time}`);
    const snapshot = await noteRef.once('value');
    if (snapshot.exists()) {
      await noteRef.update({ text, timestamp: Date.now() });
      logger.info(`Note updated for ${date} at ${time}`);
      res.status(200).json({ message: 'Note updated successfully.' });
    } else {
      logger.warn(`Note not found for ${date} at ${time} to update`);
      res.status(404).json({ error: 'Note not found.' });
    }
  } catch (error) {
    logger.error(`Error updating note for ${date} ${time}: ${error.message}`);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

/**
 * DELETE /notes/:date/:time
 * Delete a note.
 */
router.delete('/:date/:time', async (req, res) => {
  const { date, time } = req.params;
  logger.info(`DELETE request for note on ${date} at ${time}`);
  
  // Validate date and time formats
  const parsedDate = parseISO(date);
  const timePattern = /^\d{2}:\d{2}$/; // HH:MM format
  if (!isValid(parsedDate) || !timePattern.test(time)) {
    logger.warn(`Invalid date or time format received: ${date} ${time}`);
    return res.status(400).json({ error: 'Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time.' });
  }

  try {
    const noteRef = db.ref(`notes/${date}/${time}`);
    const snapshot = await noteRef.once('value');
    if (snapshot.exists()) {
      await noteRef.remove();
      logger.info(`Note deleted for ${date} at ${time}`);
      res.status(200).json({ message: 'Note deleted successfully.' });
    } else {
      logger.warn(`Note not found for ${date} at ${time} to delete`);
      res.status(404).json({ error: 'Note not found.' });
    }
  } catch (error) {
    logger.error(`Error deleting note for ${date} ${time}: ${error.message}`);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

module.exports = router;
