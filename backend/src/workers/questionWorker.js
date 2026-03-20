import 'dotenv/config';
import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import getRedisClient from '../config/redis.js';
import connectDB from '../config/db.js';
import Assignment from '../models/Assignment.js';
import { buildPrompt, callLLM, parseResponse } from '../services/aiService.js';
import { getIO } from '../config/socket.js';

// Connect to DB for standalone worker process
await connectDB();

const emitToAssignment = (assignmentId, event, data) => {
  try {
    const io = getIO();
    io.to(`assignment:${assignmentId}`).emit(event, { assignmentId, ...data });
  } catch {
    // Socket.io may not be initialized in standalone worker — log only
    console.log(`[SOCKET EMIT] ${event}`, { assignmentId, ...data });
  }
};

const questionWorker = new Worker(
  'question-generation',
  async (job) => {
    const { assignmentId } = job.data;

    console.log(`🚀 Processing job ${job.id} for assignment ${assignmentId}`);

    // Step 1: Update status → processing
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

    assignment.status = 'processing';
    await assignment.save();

    emitToAssignment(assignmentId, 'job-started', {
      message: 'AI question generation started',
      progress: 10,
    });

    await job.updateProgress(10);

    // Step 2: Build structured prompt
    console.log(`📝 Building prompt for assignment: ${assignment.title}`);
    const prompt = buildPrompt(assignment);

    emitToAssignment(assignmentId, 'job-progress', {
      message: 'Building AI prompt...',
      progress: 30,
    });
    await job.updateProgress(30);

    // Step 3: Call LLM
    console.log(`🤖 Calling Gemini AI...`);
    emitToAssignment(assignmentId, 'job-progress', {
      message: 'Generating questions with AI...',
      progress: 50,
    });
    await job.updateProgress(50);

    const rawResponse = await callLLM(prompt);
    console.log(`✅ LLM response received (${rawResponse.length} chars)`);

    emitToAssignment(assignmentId, 'job-progress', {
      message: 'Parsing and validating AI response...',
      progress: 75,
    });
    await job.updateProgress(75);

    // Step 4: Parse + validate JSON
    const structuredResult = parseResponse(rawResponse);
    console.log(
      `✅ Parsed: ${structuredResult.sections.length} sections, ${structuredResult.sections.reduce((acc, s) => acc + s.questions.length, 0)} questions`
    );

    // Step 5: Save to MongoDB
    assignment.status = 'completed';
    assignment.result = structuredResult;
    assignment.errorMessage = null;
    await assignment.save();

    emitToAssignment(assignmentId, 'job-completed', {
      message: 'Question paper generated successfully!',
      progress: 100,
      result: structuredResult,
    });
    await job.updateProgress(100);

    console.log(`✅ Job ${job.id} completed for assignment ${assignmentId}`);
    return { success: true, assignmentId };
  },
  {
    connection: getRedisClient(),
    concurrency: 3,    // Process up to 3 jobs in parallel
    limiter: {
      max: 10,
      duration: 60000, // Max 10 Gemini calls per minute
    },
  }
);

questionWorker.on('failed', async (job, error) => {
  console.error(`❌ Job ${job?.id} failed:`, error.message);

  try {
    if (job?.data?.assignmentId) {
      const assignment = await Assignment.findById(job.data.assignmentId);
      if (assignment) {
        assignment.status = 'failed';
        assignment.errorMessage = error.message;
        await assignment.save();

        emitToAssignment(job.data.assignmentId, 'job-failed', {
          message: `Generation failed: ${error.message}`,
          error: error.message,
        });
      }
    }
  } catch (dbErr) {
    console.error('Failed to update assignment on job failure:', dbErr.message);
  }
});

questionWorker.on('error', (error) => {
  console.error('Worker error:', error.message);
});

console.log('⚙️  Question generation worker started and listening...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  await questionWorker.close();
  await mongoose.disconnect();
  process.exit(0);
});
