import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  marks: { type: Number, default: 1 },
  type: { type: String, default: 'short-answer' },
  options: [String], // For MCQ
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instruction: { type: String, default: '' },
  questions: [questionSchema],
});

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    questionTypes: { type: [String], default: ['short-answer'] },
    numberOfQuestions: { type: Number, required: true, min: 1, max: 100 },
    totalMarks: { type: Number, required: true, min: 1 },
    timeAllowed: { type: String, default: '3 Hours' },
    dueDate: { type: Date },
    additionalInstructions: { type: String, default: '' },
    fileAttachment: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    result: {
      // Structured JSON paper
      sections: [sectionSchema],
    },
    errorMessage: { type: String, default: null },
    jobId: { type: String, default: null },
  },
  { timestamps: true }
);

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
