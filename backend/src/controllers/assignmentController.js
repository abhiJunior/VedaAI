import Assignment from '../models/Assignment.js';
import { questionQueue } from '../queues/questionQueue.js';

// POST /api/assignments
export const createAssignment = async (req, res) => {
  try {
    const {
      title,
      subject,
      grade,
      questionTypes,
      numberOfQuestions,
      totalMarks,
      timeAllowed,
      dueDate,
      additionalInstructions,
    } = req.body;

    // Basic validation
    if (!title || !subject || !grade || !numberOfQuestions || !totalMarks) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (numberOfQuestions < 1 || totalMarks < 1) {
      return res.status(400).json({ error: 'Questions and marks must be positive' });
    }

    const fileAttachment = req.file ? req.file.filename : null;
    console.log("1. Saving to DB...")
    const assignment = await Assignment.create({
      title,
      subject,
      grade,
      questionTypes: questionTypes ? (Array.isArray(questionTypes) ? questionTypes : [questionTypes]) : ['short-answer'],
      numberOfQuestions: parseInt(numberOfQuestions),
      totalMarks: parseInt(totalMarks),
      timeAllowed: timeAllowed || '3 Hours',
      dueDate: dueDate ? new Date(dueDate) : null,
      additionalInstructions: additionalInstructions || '',
      fileAttachment,
      status: 'pending',
    });

    // Enqueue BullMQ job
    console.log("2. Attempting to add to Queue")
    const job = await questionQueue.add(
      'generate-questions',
      { assignmentId: assignment._id.toString() },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    // Store jobId in assignment
    console.log("3. Job added!",job.id)
    assignment.jobId = job.id;
    await assignment.save();

    return res.status(201).json({
      message: 'Assignment created and queued for generation',
      assignmentId: assignment._id,
      jobId: job.id,
    });
  } catch (error) {
    console.error('createAssignment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/assignments
export const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .select('-result') // Exclude bulky result field from list
      .sort({ createdAt: -1 });
    return res.json(assignments);
  } catch (error) {
    console.error('getAllAssignments error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/assignments/:id
export const getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    return res.json(assignment);
  } catch (error) {
    console.error('getAssignment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/assignments/:id/regenerate
export const regenerateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Reset status and enqueue again
    assignment.status = 'pending';
    assignment.result = undefined;
    assignment.errorMessage = null;
    await assignment.save();

    const job = await questionQueue.add(
      'generate-questions',
      { assignmentId: assignment._id.toString() },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );

    assignment.jobId = job.id;
    await assignment.save();

    return res.json({
      message: 'Regeneration queued',
      assignmentId: assignment._id,
      jobId: job.id,
    });
  } catch (error) {
    console.error('regenerateAssignment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
