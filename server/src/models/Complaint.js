import mongoose from 'mongoose';

export const COMPLAINT_CATEGORIES = [
  'ROAD',
  'STREET_LIGHT',
  'WATER',
  'DRAINAGE',
  'WASTE',
  'PUBLIC_TRANSPORT',
  'ELECTRICITY',
  'OTHER'
];

export const COMPLAINT_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED'
];

export const COMPLAINT_SEVERITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
];

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a complaint title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please specify an infrastructure category'],
      enum: {
        values: COMPLAINT_CATEGORIES,
        message: '{VALUE} is not a valid category'
      },
      uppercase: true,
      trim: true
    },
    severity: {
      type: String,
      enum: {
        values: COMPLAINT_SEVERITIES,
        message: '{VALUE} is not a valid severity level'
      },
      default: 'MEDIUM',
      uppercase: true
    },
    status: {
      type: String,
      enum: {
        values: COMPLAINT_STATUSES,
        message: '{VALUE} is not a valid status'
      },
      default: 'SUBMITTED',
      uppercase: true
    },
    language: {
      type: String,
      default: 'en',
      trim: true
    },
    affectedGroup: {
      type: [String],
      default: []
    },
    recommendedAction: {
      type: [String],
      default: []
    },
    aiSummary: {
      type: String,
      default: ''
    },
    aiAnalysis: {
      status: { 
        type: String, 
        enum: ['PENDING', 'COMPLETED', 'FAILED'], 
        default: 'PENDING' 
      },
      reasoning: { type: String, default: '' },
      error: { type: String, default: '' },
      completedAt: { type: Date },
      urgencyScore: { type: Number, min: 0, max: 100, default: 50 },
      subCategory: { type: String, default: '' },
      safetyRiskAssessment: { type: String, default: '' },
      estimatedImpactRadiusMeters: { type: Number, default: 0 },
      recommendedDepartment: { type: String, default: '' },
      potentialDuplicateOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
        default: null
      },
      rawResponse: { type: mongoose.Schema.Types.Mixed }
    },
    // GeoJSON Point: coordinates format is [longitude, latitude]
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Location coordinates [longitude, latitude] are required']
      }
    },
    address: {
      type: String,
      required: [true, 'Please provide a street address or landmark'],
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timeline: [
      {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: false, updatedAt: true }
  }
);

// 2dsphere index for geospatial queries
complaintSchema.index({ location: '2dsphere' });
// Index for citizen lookup
complaintSchema.index({ createdBy: 1, createdAt: -1 });

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);

export default Complaint;
