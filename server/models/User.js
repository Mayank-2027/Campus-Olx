const mongoose = require('mongoose');

// Branch code mapping
const BRANCH_CODES = {
  'IT': 'Information Technology',
  'CS': 'Computer Science',
  'EE': 'Electrical Engineering',
  'EC': 'Electronics & Communication',
  'ME': 'Mechanical Engineering',
  'MT': 'Mechatronics',
  'CE': 'Civil Engineering',
  'AI': 'Artificial Intelligence',
  'IP': 'Information & Planning'
};

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profilePic: {
    type: String,
    default: ''
  },
  enrollmentNo: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true
  },
  year: {
    type: String,
    enum: ['1st', '2nd', '3rd', '4th'],
    default: null
  },
  branch: {
    type: String,
    enum: ['IT', 'CS', 'EE', 'EC', 'ME', 'MT', 'CE', 'AI', 'IP', 'other'],
    default: null
  },
  branchFull: {
    type: String,
    default: ''
  },
  joiningYear: {
    type: Number,
    default: null
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  isVerifiedSeller: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  verificationRejectedReason: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Static method: parse enrollment number
userSchema.statics.parseEnrollment = function(enrollmentNo) {
  if (!enrollmentNo || !enrollmentNo.startsWith('0201')) {
    return null;
  }

  const rest = enrollmentNo.slice(4); // Remove "0201"

  // Try matching known branch codes (longest first to handle 'ME' vs 'MT' etc.)
  const branchCodes = Object.keys(BRANCH_CODES);
  let branch = null;
  let remaining = rest;

  for (const code of branchCodes) {
    if (rest.toUpperCase().startsWith(code)) {
      branch = code;
      remaining = rest.slice(code.length);
      break;
    }
  }

  if (!branch || remaining.length < 2) return null;

  const yearCode = remaining.slice(0, 2); // e.g., "23"
  const joiningYear = 2000 + parseInt(yearCode);

  if (isNaN(joiningYear)) return null;

  return {
    branch,
    branchFull: BRANCH_CODES[branch] || 'Unknown',
    joiningYear,
    yearCode
  };
};

// Virtual: display name
userSchema.virtual('displayName').get(function() {
  return this.name.split(' ')[0];
});

userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
module.exports.BRANCH_CODES = BRANCH_CODES;
